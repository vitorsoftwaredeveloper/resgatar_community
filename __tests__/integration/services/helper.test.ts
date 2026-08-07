import * as helperModule from "../../../src/services/helper";
import { MemberModel } from "../../../src/models/Member";
import { ContributionModel } from "../../../src/models/Contribution";
import { DashboardVisibilitySettingsModel } from "../../../src/models/DashboardVisibilitySettings";
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

      expect(findByIdSpy).toHaveBeenCalledWith("member-id-123", undefined, { lean: true });
    });

    it("should forward projection to findById", async () => {
      await helperModule.findMemberById("member-id-123", { _id: 1, email: 1 });

      expect(findByIdSpy).toHaveBeenCalledWith(
        "member-id-123",
        { _id: 1, email: 1 },
        { lean: true },
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
        { lean: true },
      );
    });

    it("should forward projection to findOne", async () => {
      await helperModule.findMemberByEmail("joao@email.com", { _id: 1 });

      expect(findOneSpy).toHaveBeenCalledWith(
        { email: "joao@email.com" },
        { _id: 1 },
        { lean: true },
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

  describe("verifyInternalMember", () => {
    let findByIdSpy: jest.SpyInstance;

    beforeEach(() => {
      findByIdSpy = jest.spyOn(MemberModel, "findById");
    });

    afterEach(() => jest.restoreAllMocks());

    it("should resolve when member is admin", async () => {
      findByIdSpy.mockResolvedValue(adminMember as any);

      await expect(
        helperModule.verifyInternalMember("admin-id-123"),
      ).resolves.not.toThrow();
    });

    it("should resolve when member is user", async () => {
      findByIdSpy.mockResolvedValue(mockMember as any);

      await expect(
        helperModule.verifyInternalMember("member-id-123"),
      ).resolves.not.toThrow();
    });

    it("should throw 401 when member is guest", async () => {
      findByIdSpy.mockResolvedValue({ ...mockMember, role: "guest" } as any);

      await expect(
        helperModule.verifyInternalMember("guest-id-123"),
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Unauthorized access",
      });
    });

    it("should throw 404 when member is not found", async () => {
      findByIdSpy.mockResolvedValue(null);

      await expect(
        helperModule.verifyInternalMember("unknown-id"),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("should only read the role field", async () => {
      findByIdSpy.mockResolvedValue(mockMember as any);

      await helperModule.verifyInternalMember("member-id-123");

      expect(findByIdSpy).toHaveBeenCalledWith(
        "member-id-123",
        { role: 1 },
        { lean: true },
      );
    });
  });

  describe("verifyDashboardVisibility", () => {
    let findByIdSpy: jest.SpyInstance;
    let settingsFindOneSpy: jest.SpyInstance;

    beforeEach(() => {
      findByIdSpy = jest.spyOn(MemberModel, "findById");
      settingsFindOneSpy = jest.spyOn(
        DashboardVisibilitySettingsModel,
        "findOne",
      );
    });

    afterEach(() => jest.restoreAllMocks());

    it("should resolve for internal member regardless of settings", async () => {
      findByIdSpy.mockResolvedValue(mockMember as any);

      await expect(
        helperModule.verifyDashboardVisibility("member-id-123", "notices"),
      ).resolves.not.toThrow();

      expect(settingsFindOneSpy).not.toHaveBeenCalled();
    });

    it("should resolve for guest when the card is enabled", async () => {
      findByIdSpy.mockResolvedValue({ ...mockMember, role: "guest" } as any);
      settingsFindOneSpy.mockResolvedValue({
        notices: true,
        communityGoal: false,
        birthdays: false,
      } as any);

      await expect(
        helperModule.verifyDashboardVisibility("guest-id-123", "notices"),
      ).resolves.not.toThrow();
    });

    it("should throw 401 for guest when the card is disabled", async () => {
      findByIdSpy.mockResolvedValue({ ...mockMember, role: "guest" } as any);
      settingsFindOneSpy.mockResolvedValue({
        notices: false,
        communityGoal: false,
        birthdays: false,
      } as any);

      await expect(
        helperModule.verifyDashboardVisibility("guest-id-123", "notices"),
      ).rejects.toMatchObject({
        statusCode: 401,
        message: "Unauthorized access",
      });
    });

    it("should throw 401 for guest when no settings document exists yet", async () => {
      findByIdSpy.mockResolvedValue({ ...mockMember, role: "guest" } as any);
      settingsFindOneSpy.mockResolvedValue(null);

      await expect(
        helperModule.verifyDashboardVisibility("guest-id-123", "birthdays"),
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe("countAdmins", () => {
    afterEach(() => jest.restoreAllMocks());

    it("should count only members with admin role", async () => {
      const countSpy = jest
        .spyOn(MemberModel, "count")
        .mockResolvedValue(2 as any);

      const result = await helperModule.countAdmins();

      expect(countSpy).toHaveBeenCalledWith({ role: "admin" });
      expect(result).toBe(2);
    });
  });

  describe("ensureContributionForCurrentYear", () => {
    let findOneSpy: jest.SpyInstance;
    let insertOneSpy: jest.SpyInstance;

    beforeEach(() => {
      findOneSpy = jest.spyOn(ContributionModel, "findOne");
      insertOneSpy = jest
        .spyOn(ContributionModel, "insertOne")
        .mockResolvedValue({} as any);
    });

    afterEach(() => jest.restoreAllMocks());

    it("should create the contribution for the current year when none exists", async () => {
      findOneSpy.mockResolvedValue(null);

      await helperModule.ensureContributionForCurrentYear("member-id-123");

      expect(insertOneSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          memberId: "member-id-123",
          year: new Date().getFullYear(),
        }),
      );
    });

    it("should not create a second contribution when one already exists", async () => {
      findOneSpy.mockResolvedValue({ _id: "contribution-1" } as any);

      await helperModule.ensureContributionForCurrentYear("member-id-123");

      expect(insertOneSpy).not.toHaveBeenCalled();
    });

    it("should start the contribution at the current month, without retroactive months", async () => {
      findOneSpy.mockResolvedValue(null);

      await helperModule.ensureContributionForCurrentYear("member-id-123");

      const months = insertOneSpy.mock.calls[0][0].months;
      const monthsRemaining = 12 - new Date().getMonth();

      expect(Object.keys(months)).toHaveLength(monthsRemaining);
    });
  });
});
