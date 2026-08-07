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
  profileImage: "data:image/png;base64,OLD",
  paymentInfo: { datePayment: 5, amount: "50,00" },
  identification: { type: "CPF", numberType: "ENC:encrypted-cpf" },
};

const adminMember: IMember = { ...existingMember, _id: "admin-id", role: "admin" };

describe("editMemberService (integration)", () => {
  let findMemberByIdSpy: jest.SpyInstance;
  let verifyAdminSpy: jest.SpyInstance;
  let updateOneSpy: jest.SpyInstance;
  let updateMemberCognitoEmailSpy: jest.SpyInstance;
  let encryptSpy: jest.SpyInstance;
  let executeMongoTransactionSpy: jest.SpyInstance;
  let countAdminsSpy: jest.SpyInstance;
  let ensureContributionSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = "a".repeat(64);

    countAdminsSpy = jest
      .spyOn(helperService, "countAdmins")
      .mockResolvedValue(3);

    ensureContributionSpy = jest
      .spyOn(helperService, "ensureContributionForCurrentYear")
      .mockResolvedValue(undefined);

    findMemberByIdSpy = jest
      .spyOn(helperService, "findMemberById")
      .mockResolvedValue(existingMember);

    verifyAdminSpy = jest
      .spyOn(helperService, "verifyAdmin")
      .mockResolvedValue(undefined);

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
    await editMemberService("requester-id", "member-id-123", { firstName: "Novo" });

    expect(findMemberByIdSpy).toHaveBeenCalledWith("member-id-123");
  });

  it("should update only the fields provided in payload", async () => {
    const result = await editMemberService("requester-id", "member-id-123", { firstName: "Novo" });

    expect(result.firstName).toBe("Novo");
    expect(result.lastName).toBe(existingMember.lastName);
    expect(result.email).toBe(existingMember.email);
  });

  it("should call MemberModel.updateOne inside a transaction", async () => {
    await editMemberService("requester-id", "member-id-123", { firstName: "Novo" });

    expect(executeMongoTransactionSpy).toHaveBeenCalled();
    expect(updateOneSpy).toHaveBeenCalledWith(
      { _id: "member-id-123" },
      expect.any(Object),
      expect.objectContaining({ session: {} })
    );
  });

  it("should update Cognito email when email changes", async () => {
    await editMemberService("requester-id", "member-id-123", { email: "novo@email.com" });

    expect(updateMemberCognitoEmailSpy).toHaveBeenCalledWith(
      existingMember._id,
      "novo@email.com"
    );
  });

  it("should NOT update Cognito email when email is unchanged", async () => {
    await editMemberService("requester-id", "member-id-123", { email: existingMember.email });

    expect(updateMemberCognitoEmailSpy).not.toHaveBeenCalled();
  });

  it("should NOT update Cognito when email is not in payload", async () => {
    await editMemberService("requester-id", "member-id-123", { firstName: "Novo" });

    expect(updateMemberCognitoEmailSpy).not.toHaveBeenCalled();
  });

  it("should encrypt identification.numberType when provided", async () => {
    await editMemberService("requester-id", "member-id-123", {
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
    await editMemberService("requester-id", "member-id-123", { firstName: "Novo" });

    expect(encryptSpy).not.toHaveBeenCalled();
  });

  it("should update profileImage when provided", async () => {
    const profileImage = "data:image/png;base64,AAAA";
    const result = await editMemberService("requester-id", "member-id-123", { profileImage });

    expect(result.profileImage).toBe(profileImage);
    expect(updateOneSpy).toHaveBeenCalledWith(
      { _id: "member-id-123" },
      expect.objectContaining({ profileImage }),
      expect.any(Object)
    );
  });

  it("should NOT change profileImage when not in payload", async () => {
    const result = await editMemberService("requester-id", "member-id-123", { firstName: "Novo" });

    expect(result.profileImage).toBe(existingMember.profileImage);
  });

  it("should throw when member is not found", async () => {
    findMemberByIdSpy.mockRejectedValue({ statusCode: 404, message: "Member not found" });

    await expect(
      editMemberService("requester-id", "unknown-id", { firstName: "Novo" })
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(updateOneSpy).not.toHaveBeenCalled();
  });

  it("should return the updated member", async () => {
    const result = await editMemberService("requester-id", "member-id-123", {
      firstName: "Novo",
      lastName: "Sobrenome",
    });

    expect(result).toMatchObject({ firstName: "Novo", lastName: "Sobrenome" });
  });

  // --- role update ---

  it("should call verifyAdmin when role is in payload", async () => {
    await editMemberService("admin-id", "member-id-123", { role: "admin" });

    expect(verifyAdminSpy).toHaveBeenCalledWith("admin-id");
  });

  it("should NOT call verifyAdmin when requester edits their own profile without role", async () => {
    await editMemberService("member-id-123", "member-id-123", { firstName: "Novo" });

    expect(verifyAdminSpy).not.toHaveBeenCalled();
  });

  // --- ownership / IDOR protection ---

  it("should throw 401 when non-admin tries to edit another member's profile", async () => {
    verifyAdminSpy.mockRejectedValue({ statusCode: 401, message: "Unauthorized access" });

    await expect(
      editMemberService("user-id", "other-member-id", { firstName: "Hacked" }),
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(updateOneSpy).not.toHaveBeenCalled();
  });

  it("should call verifyAdmin when requesterId differs from memberId", async () => {
    await editMemberService("admin-id", "other-member-id", { firstName: "Novo" });

    expect(verifyAdminSpy).toHaveBeenCalledWith("admin-id");
  });

  it("should allow admin to edit another member's profile", async () => {
    const result = await editMemberService("admin-id", "other-member-id", { firstName: "Editado" });

    expect(result.firstName).toBe("Editado");
    expect(updateOneSpy).toHaveBeenCalled();
  });

  it("should allow user to edit their own profile without admin check", async () => {
    const result = await editMemberService("member-id-123", "member-id-123", { firstName: "Proprio" });

    expect(verifyAdminSpy).not.toHaveBeenCalled();
    expect(result.firstName).toBe("Proprio");
  });

  it("should update role when requester is admin", async () => {
    const result = await editMemberService("admin-id", "member-id-123", { role: "admin" });

    expect(result.role).toBe("admin");
    expect(updateOneSpy).toHaveBeenCalledWith(
      { _id: "member-id-123" },
      expect.objectContaining({ role: "admin" }),
      expect.any(Object)
    );
  });

  it("should throw 401 when non-admin tries to update role", async () => {
    verifyAdminSpy.mockRejectedValue({ statusCode: 401, message: "Unauthorized access" });

    await expect(
      editMemberService("user-id", "member-id-123", { role: "admin" })
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(updateOneSpy).not.toHaveBeenCalled();
  });

  it("should throw 403 when an admin tries to change their own role", async () => {
    findMemberByIdSpy.mockResolvedValue(adminMember);

    await expect(
      editMemberService("admin-id", "admin-id", { role: "user" }),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(updateOneSpy).not.toHaveBeenCalled();
  });

  it("should throw 409 when demoting the last remaining admin", async () => {
    findMemberByIdSpy.mockResolvedValue({ ...adminMember, _id: "other-admin-id" });
    countAdminsSpy.mockResolvedValue(1);

    await expect(
      editMemberService("admin-id", "other-admin-id", { role: "guest" }),
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(updateOneSpy).not.toHaveBeenCalled();
  });

  it("should allow demoting an admin when others remain", async () => {
    findMemberByIdSpy.mockResolvedValue({ ...adminMember, _id: "other-admin-id" });
    countAdminsSpy.mockResolvedValue(2);

    const result = await editMemberService("admin-id", "other-admin-id", {
      role: "user",
    });

    expect(result.role).toBe("user");
    expect(updateOneSpy).toHaveBeenCalled();
  });

  it("should not count admins when the target is not an admin", async () => {
    await editMemberService("admin-id", "member-id-123", { role: "guest" });

    expect(countAdminsSpy).not.toHaveBeenCalled();
  });

  it("should create the current year contribution when promoting a guest", async () => {
    findMemberByIdSpy.mockResolvedValue({ ...existingMember, role: "guest" });

    await editMemberService("admin-id", "member-id-123", { role: "user" });

    expect(ensureContributionSpy).toHaveBeenCalledWith("member-id-123");
  });

  it("should create the contribution inside the transaction", async () => {
    findMemberByIdSpy.mockResolvedValue({ ...existingMember, role: "guest" });

    const callOrder: string[] = [];
    executeMongoTransactionSpy.mockImplementation(async (fn) => {
      callOrder.push("transactionStart");
      return fn({} as any);
    });
    ensureContributionSpy.mockImplementation(async () => {
      callOrder.push("ensureContribution");
    });

    await editMemberService("admin-id", "member-id-123", { role: "user" });

    expect(callOrder).toEqual(["transactionStart", "ensureContribution"]);
  });

  it("should NOT create a contribution when demoting to guest", async () => {
    await editMemberService("admin-id", "member-id-123", { role: "guest" });

    expect(ensureContributionSpy).not.toHaveBeenCalled();
  });

  it("should NOT create a contribution when promoting an existing user to admin", async () => {
    await editMemberService("admin-id", "member-id-123", { role: "admin" });

    expect(ensureContributionSpy).not.toHaveBeenCalled();
  });

  it("should NOT create a contribution when the payload has no role", async () => {
    findMemberByIdSpy.mockResolvedValue({ ...existingMember, role: "guest" });

    await editMemberService("admin-id", "member-id-123", { firstName: "Novo" });

    expect(ensureContributionSpy).not.toHaveBeenCalled();
  });

  it("should let a guest edit their own profile without touching role rules", async () => {
    findMemberByIdSpy.mockResolvedValue({ ...existingMember, role: "guest" });

    const result = await editMemberService("member-id-123", "member-id-123", {
      firstName: "Proprio",
    });

    expect(verifyAdminSpy).not.toHaveBeenCalled();
    expect(result.firstName).toBe("Proprio");
    expect(result.role).toBe("guest");
  });

  it("should verify admin before finding the member to update", async () => {
    const callOrder: string[] = [];
    verifyAdminSpy.mockImplementation(async () => { callOrder.push("verifyAdmin"); });
    findMemberByIdSpy.mockImplementation(async () => { callOrder.push("findMember"); return existingMember; });

    await editMemberService("admin-id", "member-id-123", { role: "admin" });

    expect(callOrder.indexOf("verifyAdmin")).toBeLessThan(callOrder.indexOf("findMember"));
  });
});
