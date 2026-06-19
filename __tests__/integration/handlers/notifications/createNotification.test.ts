import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as createNotificationServiceModule from "../../../../src/services/notifications/createNotification";
import { execute } from "../../../../src/handlers/notifications/createNotification";

const validPayload = {
  title: "Aviso importante",
  description: "Reunião geral neste sábado às 10h.",
};

function buildEvent(body: any, token = "Bearer valid.token.here"): APIGatewayEvent {
  return {
    body: JSON.stringify(body),
    headers: { authorization: token },
  } as any;
}

describe("createNotification handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let createNotificationServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "admin-id-123" } as any);

    createNotificationServiceSpy = jest
      .spyOn(createNotificationServiceModule, "createNotificationService")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 201 on success", async () => {
    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(201);
  });

  it("should call createNotificationService with admin sub and payload", async () => {
    await execute(buildEvent(validPayload));

    expect(createNotificationServiceSpy).toHaveBeenCalledWith(
      "admin-id-123",
      expect.objectContaining({ title: validPayload.title, description: validPayload.description })
    );
  });

  it("should return 400 when title is missing", async () => {
    const result = await execute(buildEvent({ description: "Sem título" }));

    expect(result.statusCode).toBe(400);
    expect(createNotificationServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when description is missing", async () => {
    const result = await execute(buildEvent({ title: "Sem descrição" }));

    expect(result.statusCode).toBe(400);
    expect(createNotificationServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when type has invalid enum value", async () => {
    const result = await execute(buildEvent({ ...validPayload, type: "urgent" }));

    expect(result.statusCode).toBe(400);
    expect(createNotificationServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when additional properties are sent", async () => {
    const result = await execute(buildEvent({ ...validPayload, extra: "field" }));

    expect(result.statusCode).toBe(400);
    expect(createNotificationServiceSpy).not.toHaveBeenCalled();
  });

  it("should accept optional type field with valid enum value", async () => {
    const result = await execute(buildEvent({ ...validPayload, type: "alert" }));

    expect(result.statusCode).toBe(201);
    expect(createNotificationServiceSpy).toHaveBeenCalledWith(
      "admin-id-123",
      expect.objectContaining({ type: "alert" })
    );
  });

  it("should return 401 when caller is not admin", async () => {
    createNotificationServiceSpy.mockRejectedValue({ statusCode: 401, message: "Unauthorized access" });

    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(401);
  });

  it("should return 500 when service throws unexpected error", async () => {
    createNotificationServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(500);
  });

  it("should return 400 when body is null", async () => {
    const event = { body: null, headers: { authorization: "Bearer token" } } as any;
    const result = await execute(event);

    expect(result.statusCode).toBe(400);
    expect(createNotificationServiceSpy).not.toHaveBeenCalled();
  });
});
