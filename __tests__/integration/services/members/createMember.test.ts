import * as cognitoUtil from "../../../../src/utils/cognito";
import * as cryptoUtil from "../../../../src/utils/crypto";
import * as helperService from "../../../../src/services/helper";
import { MemberModel } from "../../../../src/models/Member";
import { createMemberService } from "../../../../src/services/members/createMember";
import { ISignUpPayload } from "../../../../src/types/members";

const basePayload: ISignUpPayload = {
  _id: "",
  email: "joao@gmail.com",
  password: "Senha@123",
  phoneNumber: "11999999999",
  firstName: "João",
  lastName: "Silva",
  dateOfBirth: Date.UTC(1990, 0, 1),
  role: "user",
  paymentInfo: { datePayment: 5, amount: "50,00" },
  identification: { type: "CPF", numberType: "52998224725" },
};

describe("createMemberService (integration)", () => {
  let createCognitoUserSpy: jest.SpyInstance;
  let removeMemberCognitoSpy: jest.SpyInstance;
  let encryptSpy: jest.SpyInstance;
  let insertOneSpy: jest.SpyInstance;
  let createContributionSpy: jest.SpyInstance;
  let findMemberByEmailSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = "a".repeat(64);

    findMemberByEmailSpy = jest
      .spyOn(helperService, "findMemberByEmail")
      .mockResolvedValue(null);

    createCognitoUserSpy = jest
      .spyOn(cognitoUtil, "createCognitoUser")
      .mockResolvedValue("cognito-user-id-123");

    removeMemberCognitoSpy = jest
      .spyOn(cognitoUtil, "removeMemberCognito")
      .mockResolvedValue(undefined);

    encryptSpy = jest
      .spyOn(cryptoUtil, "encrypt")
      .mockReturnValue("ENC:mocked");

    insertOneSpy = jest
      .spyOn(MemberModel, "insertOne")
      .mockResolvedValue({} as any);

    createContributionSpy = jest
      .spyOn(helperService, "createContributionByYear")
      .mockResolvedValue({} as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.ENCRYPTION_KEY;
  });

  it("should create cognito user with correct email and password", async () => {
    await createMemberService({ ...basePayload });

    expect(createCognitoUserSpy).toHaveBeenCalledWith(
      basePayload.email,
      basePayload.password,
    );
  });

  it("should encrypt identification.numberType before saving", async () => {
    await createMemberService({ ...basePayload });

    expect(encryptSpy).toHaveBeenCalledWith(basePayload.identification.numberType);
  });

  it("should call MemberModel.insertOne with encrypted identification", async () => {
    await createMemberService({ ...basePayload });

    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        identification: expect.objectContaining({ numberType: "ENC:mocked" }),
      }),
    );
  });

  it("should call createContributionByYear after inserting member", async () => {
    await createMemberService({ ...basePayload });

    expect(createContributionSpy).toHaveBeenCalled();
  });

  it("should return the cognito user id", async () => {
    const result = await createMemberService({ ...basePayload });

    expect(result).toBe("cognito-user-id-123");
  });

  it("should call removeMemberCognito (rollback) when DB insert fails", async () => {
    insertOneSpy.mockRejectedValue({ code: 11000 });

    await expect(createMemberService({ ...basePayload })).rejects.toBeDefined();

    expect(removeMemberCognitoSpy).toHaveBeenCalled();
  });

  it("should NOT save to DB when cognito creation fails", async () => {
    createCognitoUserSpy.mockRejectedValue(new Error("Cognito error"));

    await expect(createMemberService({ ...basePayload })).rejects.toThrow("Cognito error");

    expect(insertOneSpy).not.toHaveBeenCalled();
  });

  it("should map Cognito UsernameExistsException to a generic 409", async () => {
    createCognitoUserSpy.mockRejectedValue({ name: "UsernameExistsException" });

    await expect(createMemberService({ ...basePayload })).rejects.toMatchObject({
      statusCode: 409,
      message: "Não foi possível concluir o cadastro com este email.",
    });
  });

  it("should NOT call removeMemberCognito when Cognito rejects (no user created)", async () => {
    createCognitoUserSpy.mockRejectedValue({ name: "UsernameExistsException" });

    await expect(createMemberService({ ...basePayload })).rejects.toBeDefined();

    expect(removeMemberCognitoSpy).not.toHaveBeenCalled();
  });

  it("should still throw the original error if Cognito rollback fails", async () => {
    insertOneSpy.mockRejectedValue({ code: 11000 });
    removeMemberCognitoSpy.mockRejectedValue(new Error("rollback failed"));

    await expect(createMemberService({ ...basePayload })).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("should NOT create contribution when DB insert fails", async () => {
    insertOneSpy.mockRejectedValue({ code: 11000 });

    await expect(createMemberService({ ...basePayload })).rejects.toBeDefined();

    expect(createContributionSpy).not.toHaveBeenCalled();
  });

  it("should set member status as active", async () => {
    await createMemberService({ ...basePayload });

    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: "active" }),
    );
  });

  it("should check email availability before creating cognito user", async () => {
    await createMemberService({ ...basePayload });

    expect(findMemberByEmailSpy).toHaveBeenCalledWith(
      basePayload.email,
      expect.any(Object),
    );
    expect(findMemberByEmailSpy.mock.invocationCallOrder[0]).toBeLessThan(
      createCognitoUserSpy.mock.invocationCallOrder[0],
    );
  });

  it("should throw 409 with a generic message when email already exists", async () => {
    findMemberByEmailSpy.mockResolvedValue({ _id: "existing-id" } as any);

    await expect(createMemberService({ ...basePayload })).rejects.toMatchObject({
      statusCode: 409,
      message: "Não foi possível concluir o cadastro com este email.",
    });
  });

  it("should NOT create cognito user or insert when email already exists", async () => {
    findMemberByEmailSpy.mockResolvedValue({ _id: "existing-id" } as any);

    await expect(createMemberService({ ...basePayload })).rejects.toBeDefined();

    expect(createCognitoUserSpy).not.toHaveBeenCalled();
    expect(insertOneSpy).not.toHaveBeenCalled();
    expect(removeMemberCognitoSpy).not.toHaveBeenCalled();
  });

  it("should throw 409 generic message when DB insert hits the unique index", async () => {
    insertOneSpy.mockRejectedValue({ code: 11000 });

    await expect(createMemberService({ ...basePayload })).rejects.toMatchObject({
      statusCode: 409,
      message: "Não foi possível concluir o cadastro com este email.",
    });
  });

  it("should default role to user when not provided", async () => {
    const payload = { ...basePayload, role: undefined as any };
    await createMemberService(payload);

    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({ role: "user" }),
    );
  });
});
