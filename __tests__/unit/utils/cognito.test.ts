import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  createCognitoUser,
  removeMemberCognito,
  updateMemberCognitoEmail,
  changeCognitoPassword,
} from "../../../src/utils/cognito";

const spySend = (impl: (...args: any[]) => any) =>
  jest
    .spyOn(CognitoIdentityProviderClient.prototype, "send")
    .mockImplementation(impl as any);

const USER_POOL_ID = "us-east-1_testPool";

beforeEach(() => {
  process.env.USER_POOL_ID = USER_POOL_ID;
});

afterEach(() => {
  delete process.env.USER_POOL_ID;
  jest.restoreAllMocks();
});

describe("createCognitoUser", () => {
  const buildSendMock = (sub = "cognito-sub-123") =>
    jest.fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ UserAttributes: [{ Name: "sub", Value: sub }] });

  it("should create user, set permanent password and return the sub", async () => {
    spySend(buildSendMock("cognito-sub-123"));

    const result = await createCognitoUser("test@email.com", "Senha@123");

    expect(result).toBe("cognito-sub-123");
  });

  it("should send AdminCreateUserCommand with correct email and temp password", async () => {
    const sendSpy = spySend(buildSendMock());

    await createCognitoUser("test@email.com", "Senha@123");

    const firstCall = sendSpy.mock.calls[0][0];
    expect(firstCall).toBeInstanceOf(AdminCreateUserCommand);
    expect((firstCall as any).input).toMatchObject({
      UserPoolId: USER_POOL_ID,
      Username: "test@email.com",
      TemporaryPassword: "Temp123!",
    });
  });

  it("should send AdminSetUserPasswordCommand with permanent flag", async () => {
    const sendSpy = spySend(buildSendMock());

    await createCognitoUser("test@email.com", "Senha@123");

    const secondCall = sendSpy.mock.calls[1][0];
    expect(secondCall).toBeInstanceOf(AdminSetUserPasswordCommand);
    expect((secondCall as any).input).toMatchObject({
      UserPoolId: USER_POOL_ID,
      Username: "test@email.com",
      Password: "Senha@123",
      Permanent: true,
    });
  });

  it("should make 3 Cognito calls: create, set password, get user", async () => {
    const sendSpy = spySend(buildSendMock());

    await createCognitoUser("test@email.com", "Senha@123");

    expect(sendSpy).toHaveBeenCalledTimes(3);
  });

  it("should throw and propagate Cognito errors", async () => {
    spySend(() => Promise.reject(new Error("UsernameExistsException")));

    await expect(createCognitoUser("test@email.com", "Senha@123"))
      .rejects.toThrow("UsernameExistsException");
  });
});

describe("removeMemberCognito", () => {
  it("should send AdminDeleteUserCommand with correct memberId", async () => {
    const sendSpy = spySend(() => Promise.resolve({}));

    await removeMemberCognito("member-id-123");

    const call = sendSpy.mock.calls[0][0];
    expect(call).toBeInstanceOf(AdminDeleteUserCommand);
    expect((call as any).input).toMatchObject({
      UserPoolId: USER_POOL_ID,
      Username: "member-id-123",
    });
  });

  it("should throw and propagate Cognito errors", async () => {
    spySend(() => Promise.reject(new Error("UserNotFoundException")));

    await expect(removeMemberCognito("unknown-id"))
      .rejects.toThrow("UserNotFoundException");
  });
});

describe("updateMemberCognitoEmail", () => {
  it("should send AdminUpdateUserAttributesCommand with new email and verified flag", async () => {
    const sendSpy = spySend(() => Promise.resolve({}));

    await updateMemberCognitoEmail("member-id-123", "novo@email.com");

    const call = sendSpy.mock.calls[0][0];
    expect(call).toBeInstanceOf(AdminUpdateUserAttributesCommand);
    expect((call as any).input).toMatchObject({
      UserPoolId: USER_POOL_ID,
      Username: "member-id-123",
      UserAttributes: expect.arrayContaining([
        { Name: "email", Value: "novo@email.com" },
        { Name: "email_verified", Value: "true" },
      ]),
    });
  });

  it("should mark email as verified after update", async () => {
    const sendSpy = spySend(() => Promise.resolve({}));

    await updateMemberCognitoEmail("member-id-123", "novo@email.com");

    const attrs = (sendSpy.mock.calls[0][0] as any).input.UserAttributes;
    const verified = attrs.find((a: any) => a.Name === "email_verified");
    expect(verified?.Value).toBe("true");
  });

  it("should throw and propagate Cognito errors", async () => {
    spySend(() => Promise.reject(new Error("UserNotFoundException")));

    await expect(updateMemberCognitoEmail("unknown-id", "email@email.com"))
      .rejects.toThrow("UserNotFoundException");
  });
});

describe("changeCognitoPassword", () => {
  it("should send AdminSetUserPasswordCommand with correct credentials and permanent flag", async () => {
    const sendSpy = spySend(() => Promise.resolve({}));

    await changeCognitoPassword("member-id-123", "Nova@Senha1");

    const call = sendSpy.mock.calls[0][0];
    expect(call).toBeInstanceOf(AdminSetUserPasswordCommand);
    expect((call as any).input).toMatchObject({
      UserPoolId: USER_POOL_ID,
      Username: "member-id-123",
      Password: "Nova@Senha1",
      Permanent: true,
    });
  });

  it("should throw and propagate Cognito errors", async () => {
    spySend(() => Promise.reject(new Error("InvalidPasswordException")));

    await expect(changeCognitoPassword("member-id-123", "fraca"))
      .rejects.toThrow("InvalidPasswordException");
  });
});
