import * as helperService from "../../../../src/services/helper";
import * as cognitoUtil from "../../../../src/utils/cognito";
import * as cryptoUtil from "../../../../src/utils/crypto";
import * as mongooseUtil from "../../../../src/utils/mongoose";
import { MemberModel } from "../../../../src/models/Member";
import { editMemberService } from "../../../../src/services/members/editMember";
import { IMember } from "../../../../src/types/members";

const existingMember: IMember = {
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

describe("editMemberService (integration)", () => {
  let findMemberByIdSpy: jest.SpyInstance;
  let updateOneSpy: jest.SpyInstance;
  let updateMemberCognitoEmailSpy: jest.SpyInstance;
  let encryptSpy: jest.SpyInstance;
  let executeMongoTransactionSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = "a".repeat(64);

    findMemberByIdSpy = jest
      .spyOn(helperService, "findMemberById")
      .mockResolvedValue(existingMember);

    updateOneSpy = jest
      .spyOn(MemberModel, "updateOne")
      .mockResolvedValue({} as any);

    updateMemberCognitoEmailSpy = jest
      .spyOn(cognitoUtil, "updateMemberCognitoEmail")
      .mockResolvedValue(undefined);

    encryptSpy = jest
      .spyOn(cryptoUtil, "encrypt")
      .mockReturnValue("ENC:new-encrypted");

    executeMongoTransactionSpy = jest
      .spyOn(mongooseUtil, "executeMongoTransaction")
      .mockImplementation(async (fn) => fn({} as any));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.ENCRYPTION_KEY;
  });

  it("should find member before updating", async () => {
    await editMemberService("member-id-123", { firstName: "Novo" });

    expect(findMemberByIdSpy).toHaveBeenCalledWith("member-id-123");
  });

  it("should update only the fields provided in payload", async () => {
    const result = await editMemberService("member-id-123", { firstName: "Novo" });

    expect(result.firstName).toBe("Novo");
    expect(result.lastName).toBe(existingMember.lastName);
    expect(result.email).toBe(existingMember.email);
  });

  it("should call MemberModel.updateOne inside a transaction", async () => {
    await editMemberService("member-id-123", { firstName: "Novo" });

    expect(executeMongoTransactionSpy).toHaveBeenCalled();
    expect(updateOneSpy).toHaveBeenCalledWith(
      { _id: "member-id-123" },
      expect.any(Object),
      expect.objectContaining({ session: {} })
    );
  });

  it("should update Cognito email when email changes", async () => {
    await editMemberService("member-id-123", { email: "novo@email.com" });

    expect(updateMemberCognitoEmailSpy).toHaveBeenCalledWith(
      existingMember._id,
      "novo@email.com"
    );
  });

  it("should NOT update Cognito email when email is unchanged", async () => {
    await editMemberService("member-id-123", { email: existingMember.email });

    expect(updateMemberCognitoEmailSpy).not.toHaveBeenCalled();
  });

  it("should NOT update Cognito when email is not in payload", async () => {
    await editMemberService("member-id-123", { firstName: "Novo" });

    expect(updateMemberCognitoEmailSpy).not.toHaveBeenCalled();
  });

  it("should encrypt identification.numberType when provided", async () => {
    await editMemberService("member-id-123", {
      identification: { type: "CPF", numberType: "12345678900" },
    });

    expect(encryptSpy).toHaveBeenCalledWith("12345678900");
    expect(updateOneSpy).toHaveBeenCalledWith(
      { _id: "member-id-123" },
      expect.objectContaining({
        identification: { type: "CPF", numberType: "ENC:new-encrypted" },
      }),
      expect.any(Object)
    );
  });

  it("should NOT encrypt when identification is not in payload", async () => {
    await editMemberService("member-id-123", { firstName: "Novo" });

    expect(encryptSpy).not.toHaveBeenCalled();
  });

  it("should throw when member is not found", async () => {
    findMemberByIdSpy.mockRejectedValue({ statusCode: 404, message: "Member not found" });

    await expect(
      editMemberService("unknown-id", { firstName: "Novo" })
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(updateOneSpy).not.toHaveBeenCalled();
  });

  it("should return the updated member", async () => {
    const result = await editMemberService("member-id-123", { firstName: "Novo", lastName: "Sobrenome" });

    expect(result).toMatchObject({ firstName: "Novo", lastName: "Sobrenome" });
  });
});
