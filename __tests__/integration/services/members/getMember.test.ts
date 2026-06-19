import * as helperService from "../../../../src/services/helper";
import * as cryptoUtil from "../../../../src/utils/crypto";
import { ContributionModel } from "../../../../src/models/Contribution";
import { getMemberService } from "../../../../src/services/members/getMember";
import { IMember } from "../../../../src/types/members";

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
  identification: { type: "CPF", numberType: "ENC:encrypted-cpf" },
};

const mockContribution = {
  memberId: "member-id-123",
  year: 2025,
  months: { january: { paid: false } },
};

describe("getMemberService (integration)", () => {
  let findMemberByIdSpy: jest.SpyInstance;
  let findOneContributionSpy: jest.SpyInstance;
  let decryptSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = "a".repeat(64);

    findMemberByIdSpy = jest
      .spyOn(helperService, "findMemberById")
      .mockResolvedValue(mockMember);

    findOneContributionSpy = jest
      .spyOn(ContributionModel, "findOne")
      .mockResolvedValue(mockContribution as any);

    decryptSpy = jest
      .spyOn(cryptoUtil, "decrypt")
      .mockReturnValue("12345678900");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.ENCRYPTION_KEY;
  });

  it("should find member by id with correct projection", async () => {
    await getMemberService("member-id-123");

    expect(findMemberByIdSpy).toHaveBeenCalledWith(
      "member-id-123",
      expect.objectContaining({ _id: 1, email: 1, identification: 1 })
    );
  });

  it("should decrypt identification.numberType before returning", async () => {
    const result = await getMemberService("member-id-123");

    expect(decryptSpy).toHaveBeenCalledWith(mockMember.identification.numberType);
    expect(result.identification.numberType).toBe("12345678900");
  });

  it("should fetch contributions for current year", async () => {
    await getMemberService("member-id-123");

    expect(findOneContributionSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        memberId: "member-id-123",
        year: new Date().getFullYear(),
      }),
      expect.any(Object)
    );
  });

  it("should include contributions in the returned member", async () => {
    const result = await getMemberService("member-id-123");

    expect(result.contributions).toEqual(mockContribution);
  });

  it("should return null contributions when member has none for current year", async () => {
    findOneContributionSpy.mockResolvedValue(null);

    const result = await getMemberService("member-id-123");

    expect(result.contributions).toBeNull();
  });

  it("should throw when member is not found", async () => {
    findMemberByIdSpy.mockRejectedValue({ statusCode: 404, message: "Member not found" });

    await expect(getMemberService("unknown-id")).rejects.toMatchObject({ statusCode: 404 });

    expect(decryptSpy).not.toHaveBeenCalled();
  });
});
