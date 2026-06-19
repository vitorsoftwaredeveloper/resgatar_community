import * as helperService from "../../../../src/services/helper";
import * as cognitoUtil from "../../../../src/utils/cognito";
import { updatePasswordService } from "../../../../src/services/members/updatePassword";
import { IMember } from "../../../../src/types/members";

const adminMember: IMember = {
  _id: "admin-id-123",
  email: "admin@email.com",
  phoneNumber: "11999999999",
  firstName: "Admin",
  lastName: "User",
  dateOfBirth: 946684800000,
  role: "admin",
  status: "active",
  paymentInfo: { datePayment: 5, amount: "50,00" },
  identification: { type: "CPF", numberType: "ENC:encrypted" },
};

const regularMember: IMember = {
  ...adminMember,
  _id: "user-id-456",
  email: "user@email.com",
  role: "user",
};

describe("updatePasswordService (integration)", () => {
  let findMemberByIdSpy: jest.SpyInstance;
  let changeCognitoPasswordSpy: jest.SpyInstance;

  beforeEach(() => {
    findMemberByIdSpy = jest.spyOn(helperService, "findMemberById");

    changeCognitoPasswordSpy = jest
      .spyOn(cognitoUtil, "changeCognitoPassword")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should allow admin to update any member password", async () => {
    findMemberByIdSpy
      .mockResolvedValueOnce(adminMember)
      .mockResolvedValueOnce(regularMember);

    await updatePasswordService("admin-id-123", "Nova@Senha1", "user-id-456");

    expect(changeCognitoPasswordSpy).toHaveBeenCalledWith("user-id-456", "Nova@Senha1");
  });

  it("should allow user to update their own password", async () => {
    findMemberByIdSpy
      .mockResolvedValueOnce(regularMember)
      .mockResolvedValueOnce(regularMember);

    await updatePasswordService("user-id-456", "Nova@Senha1", "user-id-456");

    expect(changeCognitoPasswordSpy).toHaveBeenCalledWith("user-id-456", "Nova@Senha1");
  });

  it("should return 403 when regular user tries to update another member password", async () => {
    const otherMember = { ...regularMember, _id: "other-user-789" };

    findMemberByIdSpy
      .mockResolvedValueOnce(regularMember)
      .mockResolvedValueOnce(otherMember);

    const result = await updatePasswordService("user-id-456", "Nova@Senha1", "other-user-789");

    expect(result).toMatchObject({ statusCode: 403 });
    expect(changeCognitoPasswordSpy).not.toHaveBeenCalled();
  });

  it("should fetch both caller and target member", async () => {
    findMemberByIdSpy
      .mockResolvedValueOnce(adminMember)
      .mockResolvedValueOnce(regularMember);

    await updatePasswordService("admin-id-123", "Nova@Senha1", "user-id-456");

    expect(findMemberByIdSpy).toHaveBeenCalledWith("admin-id-123");
    expect(findMemberByIdSpy).toHaveBeenCalledWith("user-id-456");
  });

  it("should throw when caller member is not found", async () => {
    findMemberByIdSpy.mockRejectedValueOnce({ statusCode: 404, message: "Member not found" });

    await expect(
      updatePasswordService("unknown-id", "Nova@Senha1", "user-id-456")
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(changeCognitoPasswordSpy).not.toHaveBeenCalled();
  });

  it("should throw when Cognito password change fails", async () => {
    findMemberByIdSpy
      .mockResolvedValueOnce(adminMember)
      .mockResolvedValueOnce(regularMember);

    changeCognitoPasswordSpy.mockRejectedValue(new Error("Cognito error"));

    await expect(
      updatePasswordService("admin-id-123", "Nova@Senha1", "user-id-456")
    ).rejects.toThrow("Cognito error");
  });
});
