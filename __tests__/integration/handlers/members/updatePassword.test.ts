import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as updatePasswordServiceModule from "../../../../src/services/members/updatePassword";
import { execute } from "../../../../src/handlers/members/updatePassword";

const validPayload = { password: "Nova@Senha1" };

function buildEvent(
  body: any,
  memberId: string | undefined = "member-to-update",
  token = "Bearer valid.token.here"
): APIGatewayEvent {
  return {
    body: JSON.stringify(body),
    headers: { authorization: token },
    pathParameters: memberId ? { memberId } : null,
  } as any;
}

describe("updatePassword handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let updatePasswordServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "caller-id-123" } as any);

    updatePasswordServiceSpy = jest
      .spyOn(updatePasswordServiceModule, "updatePasswordService")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 204 on success", async () => {
    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(204);
  });

  it("should call updatePasswordService with caller sub, password and memberId", async () => {
    await execute(buildEvent(validPayload, "member-to-update"));

    expect(updatePasswordServiceSpy).toHaveBeenCalledWith(
      "caller-id-123",
      validPayload.password,
      "member-to-update"
    );
  });

  it("should return 400 when memberId is missing from path", async () => {
    const event = {
      body: JSON.stringify(validPayload),
      headers: { authorization: "Bearer valid.token.here" },
      pathParameters: null,
    } as any;

    const result = await execute(event);

    expect(result.statusCode).toBe(400);
  });


  it("should throw 400 when password does not meet complexity requirements", async () => {
    await expect(
      execute(buildEvent({ password: "simples" }))
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(updatePasswordServiceSpy).not.toHaveBeenCalled();
  });

  it("should throw 400 when password is missing", async () => {
    await expect(
      execute(buildEvent({}))
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(updatePasswordServiceSpy).not.toHaveBeenCalled();
  });

  it("should throw 400 when additional properties are sent", async () => {
    await expect(
      execute(buildEvent({ ...validPayload, extra: "field" }))
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("should return 403 when service denies authorization", async () => {
    updatePasswordServiceSpy.mockRejectedValue({
      statusCode: 403,
      message: "You are not authorized to update this password",
    });

    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(403);
  });

  it("should return 500 when service throws unexpected error", async () => {
    updatePasswordServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(500);
  });
});
