import * as cognitoUtil from "../../../../src/utils/cognito";
import * as cryptoUtil from "../../../../src/utils/crypto";
import * as helperService from "../../../../src/services/helper";
import * as removeMemberModule from "../../../../src/services/members/removeMember";
import { MemberModel } from "../../../../src/models/Member";
import { createMemberService } from "../../../../src/services/members/createMember";
import { ISignUpPayload } from "../../../../src/types/members";

const basePayload: ISignUpPayload = {
  _id: "",
  email: "joao@email.com",
  password: "Senha@123",
  phoneNumber: "11999999999",
  firstName: "João",
  lastName: "Silva",
  dateOfBirth: Date.UTC(1990, 0, 1),
  role: "user",
  paymentInfo: { datePayment: 5, amount: "50,00" },
  identification: { type: "CPF", numberType: "12345678900" },
};

describe("createMemberService (integration)", () => {
  let createCognitoUserSpy: jest.SpyInstance;
  let encryptSpy: jest.SpyInstance;
  let insertOneSpy: jest.SpyInstance;
  let createContributionSpy: jest.SpyInstance;
  let removeMemberSpy: jest.SpyInstance;
  let removeMemberServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = "a".repeat(64);

    createCognitoUserSpy = jest
      .spyOn(cognitoUtil, "createCognitoUser")
      .mockResolvedValue("cognito-user-id-123");

    encryptSpy = jest
      .spyOn(cryptoUtil, "encrypt")
      .mockReturnValue("ENC:mocked");

    insertOneSpy = jest
      .spyOn(MemberModel, "insertOne")
      .mockResolvedValue({} as any);

    createContributionSpy = jest
      .spyOn(helperService, "createContributionByYear")
      .mockResolvedValue({} as any);

    removeMemberSpy = jest
      .spyOn(cognitoUtil, "removeMemberCognito" as any)
      .mockResolvedValue(undefined);

    removeMemberServiceSpy = jest
      .spyOn(removeMemberModule, "removeMemberService")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.ENCRYPTION_KEY;
  });

  it("should create cognito user with correct email and password", async () => {
    await createMemberService("admin-id", { ...basePayload });

    expect(createCognitoUserSpy).toHaveBeenCalledWith(
      basePayload.email,
      basePayload.password
    );
  });

  it("should encrypt identification.numberType before saving", async () => {
    await createMemberService("admin-id", { ...basePayload });

    expect(encryptSpy).toHaveBeenCalledWith(basePayload.identification.numberType);
  });

  it("should call MemberModel.insertOne with encrypted identification", async () => {
    await createMemberService("admin-id", { ...basePayload });

    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        identification: expect.objectContaining({ numberType: "ENC:mocked" }),
      })
    );
  });

  it("should call createContributionByYear after inserting member", async () => {
    await createMemberService("admin-id", { ...basePayload });

    expect(createContributionSpy).toHaveBeenCalled();
  });

  it("should return the cognito user id", async () => {
    const result = await createMemberService("admin-id", { ...basePayload });
    expect(result).toBe("cognito-user-id-123");
  });

  it("should NOT save to DB when cognito creation fails", async () => {
    createCognitoUserSpy.mockRejectedValue(new Error("Cognito error"));

    await expect(
      createMemberService("admin-id", { ...basePayload })
    ).rejects.toThrow("Cognito error");

    expect(insertOneSpy).not.toHaveBeenCalled();
  });

  it("should NOT create contribution when DB insert fails", async () => {
    insertOneSpy.mockRejectedValue({ code: 11000 });

    await expect(
      createMemberService("admin-id", { ...basePayload })
    ).rejects.toBeDefined();

    expect(createContributionSpy).not.toHaveBeenCalled();
  });

  it("should set member status as active", async () => {
    await createMemberService("admin-id", { ...basePayload });

    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: "active" })
    );
  });

  it("should default role to user when not provided", async () => {
    const payload = { ...basePayload, role: undefined as any };
    await createMemberService("admin-id", payload);

    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({ role: "user" })
    );
  });
});
