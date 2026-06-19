import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as updatePushTokenServiceModule from "../../../../src/services/members/updatePushToken";
import { execute } from "../../../../src/handlers/members/updatePushToken";

function buildEvent(body: any, token = "Bearer valid.token.here"): APIGatewayEvent {
  return {
    body: JSON.stringify(body),
    headers: { authorization: token },
  } as any;
}

describe("updatePushToken handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let updatePushTokenServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "member-id-123" } as any);

    updatePushTokenServiceSpy = jest
      .spyOn(updatePushTokenServiceModule, "updatePushTokenService")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 204 on success", async () => {
    const result = await execute(buildEvent({ pushToken: "valid-push-token" }));

    expect(result.statusCode).toBe(204);
  });

  it("should call updatePushTokenService with member sub and pushToken", async () => {
    await execute(buildEvent({ pushToken: "valid-push-token" }));

    expect(updatePushTokenServiceSpy).toHaveBeenCalledWith("member-id-123", "valid-push-token");
  });

  it("should return 400 when pushToken is missing", async () => {
    const result = await execute(buildEvent({}));

    expect(result.statusCode).toBe(400);
    expect(updatePushTokenServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when pushToken is not a string", async () => {
    const result = await execute(buildEvent({ pushToken: 12345 }));

    expect(result.statusCode).toBe(400);
    expect(updatePushTokenServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when body is null", async () => {
    const event = { body: null, headers: { authorization: "Bearer token" } } as any;
    const result = await execute(event);

    expect(result.statusCode).toBe(400);
    expect(updatePushTokenServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 404 when member is not found", async () => {
    updatePushTokenServiceSpy.mockRejectedValue({ statusCode: 404, message: "Member not found" });

    const result = await execute(buildEvent({ pushToken: "token" }));

    expect(result.statusCode).toBe(404);
  });

  it("should return 500 when service throws unexpected error", async () => {
    updatePushTokenServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent({ pushToken: "token" }));

    expect(result.statusCode).toBe(500);
  });
});
