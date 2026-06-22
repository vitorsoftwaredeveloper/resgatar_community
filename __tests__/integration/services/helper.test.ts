import * as helperModule from "../../../src/services/helper";
import { MemberModel } from "../../../src/models/Member";
import { ContributionModel } from "../../../src/models/Contribution";
import { IMember } from "../../../src/types/members";

const mockMember: IMember = {
  _id: "member-id-123",
  email: "joao@email.com",
  phoneNumber: "11999999999",
  firstName: "João",
  lastName: "Silva",
  dateOfBirth: 946684800000,
  role: "user",
  status: "active",
  paymentInfo: { datePayment: 5, amount: "50,00" },
  identification: { type: "CPF", numberType: "ENC:encrypted" },
};

const adminMember: IMember = {
  ...mockMember,
  _id: "admin-id-123",
  role: "admin",
};

describe("services/helper", () => {
  describe("findMemberById", () => {
    let findByIdSpy: jest.SpyInstance;

    beforeEach(() => {
      findByIdSpy = jest
        .spyOn(MemberModel, "findById")
        .mockResolvedValue(mockMember as any);
    });

    afterEach(() => jest.restoreAllMocks());

    it("should call MemberModel.findById with the given id", async () => {
      await helperModule.findMemberById("member-id-123");

      expect(findByIdSpy).toHaveBeenCalledWith("member-id-123", undefined, {});
    });

    it("should forward projection to findById", async () => {
      await helperModule.findMemberById("member-id-123", { _id: 1, email: 1 });

      expect(findByIdSpy).toHaveBeenCalledWith(
        "member-id-123",
        { _id: 1, email: 1 },
        {},
      );
    });

    it("should return the found member", async () => {
      const result = await helperModule.findMemberById("member-id-123");

      expect(result).toEqual(mockMember);
    });

    it("should throw 404 when member is not found", async () => {
      findByIdSpy.mockResolvedValue(null);

      await expect(
        helperModule.findMemberById("unknown-id"),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Member not found",
      });
    });
  });

  describe("findMemberByEmail", () => {
    let findOneSpy: jest.SpyInstance;

    beforeEach(() => {
      findOneSpy = jest
        .spyOn(MemberModel, "findOne")
        .mockResolvedValue(mockMember as any);
    });

    afterEach(() => jest.restoreAllMocks());

    it("should query by normalized (trimmed, lowercased) email", async () => {
      await helperModule.findMemberByEmail("  JOAO@Email.com  ");

      expect(findOneSpy).toHaveBeenCalledWith(
        { email: "joao@email.com" },
        undefined,
      );
    });

    it("should forward projection to findOne", async () => {
      await helperModule.findMemberByEmail("joao@email.com", { _id: 1 });

      expect(findOneSpy).toHaveBeenCalledWith(
        { email: "joao@email.com" },
        { _id: 1 },
      );
    });

    it("should return the found member", async () => {
      const result = await helperModule.findMemberByEmail("joao@email.com");

      expect(result).toEqual(mockMember);
    });

    it("should return null when no member matches", async () => {
      findOneSpy.mockResolvedValue(null);

      const result = await helperModule.findMemberByEmail("ghost@email.com");

      expect(result).toBeNull();
    });
  });

  describe("verifyAdmin", () => {
    let findByIdSpy: jest.SpyInstance;

    beforeEach(() => {
      findByIdSpy = jest
        .spyOn(MemberModel, "findById")
        .mockResolvedValue(adminMember as any);
    });

    afterEach(() => jest.restoreAllMocks());

    it("should resolve when member is admin", async () => {
      await expect(
        helperModule.verifyAdmin("admin-id-123"),
      ).resolves.not.toThrow();
    });

    it("should throw 401 when member role is user", async () => {
      findByIdSpy.mockResolvedValue(mockMember as any);

      await expect(
        helperModule.verifyAdmin("member-id-123"),
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Unauthorized access",
      });
    });

    it("should throw 404 when member is not found", async () => {
      findByIdSpy.mockResolvedValue(null);

      await expect(
        helperModule.verifyAdmin("unknown-id"),
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Member not found",
      });
    });
  });

  describe("createContributionByYear", () => {
    let insertOneSpy: jest.SpyInstance;

    beforeEach(() => {
      insertOneSpy = jest
        .spyOn(ContributionModel, "insertOne")
        .mockResolvedValue({} as any);
    });

    afterEach(() => jest.restoreAllMocks());

    it("should call ContributionModel.insertOne with correct memberId and year", async () => {
      await helperModule.createContributionByYear("member-id-123", 2025, 0);

      expect(insertOneSpy).toHaveBeenCalledWith(
        expect.objectContaining({ memberId: "member-id-123", year: 2025 }),
      );
    });

    it("should include all months starting from the given monthIndex", async () => {
      await helperModule.createContributionByYear("member-id-123", 2025, 0);

      const months = insertOneSpy.mock.calls[0][0].months;
      expect(Object.keys(months)).toHaveLength(12);
      expect(months.january).toEqual({ paid: false });
      expect(months.december).toEqual({ paid: false });
    });

    it("should include only remaining months when starting mid-year", async () => {
      await helperModule.createContributionByYear("member-id-123", 2025, 6);

      const months = insertOneSpy.mock.calls[0][0].months;
      expect(Object.keys(months)).toHaveLength(6);
      expect(months.july).toEqual({ paid: false });
      expect(months.december).toEqual({ paid: false });
      expect(months.january).toBeUndefined();
      expect(months.june).toBeUndefined();
    });

    it("should include only december when starting at monthIndex 11", async () => {
      await helperModule.createContributionByYear("member-id-123", 2025, 11);

      const months = insertOneSpy.mock.calls[0][0].months;
      expect(Object.keys(months)).toHaveLength(1);
      expect(months.december).toEqual({ paid: false });
    });

    it("should set all months as paid: false", async () => {
      await helperModule.createContributionByYear("member-id-123", 2025, 0);

      const months = insertOneSpy.mock.calls[0][0].months;
      Object.values(months).forEach((month: any) => {
        expect(month.paid).toBe(false);
      });
    });
  });
});
