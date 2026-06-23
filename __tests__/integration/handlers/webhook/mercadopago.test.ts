import { APIGatewayEvent } from "aws-lambda";
import * as mercadopagoIntegration from "../../../../src/integrations/mercadopago";
import * as webhookService from "../../../../src/services/webhook/mercadopago";
import { execute } from "../../../../src/handlers/webhook/mercadopago";

function buildEvent(overrides: Partial<APIGatewayEvent> = {}): APIGatewayEvent {
  return {
    body: JSON.stringify({ type: "payment", data: { id: "12345" } }),
    headers: {
      "x-signature": "ts=1234,v1=validhash",
      "x-request-id": "req-abc",
    },
    ...overrides,
  } as any;
}

describe("mercadoPagoWebhook handler (integration)", () => {
  let validateSignatureSpy: jest.SpyInstance;
  let processWebhookSpy: jest.SpyInstance;

  beforeEach(() => {
    validateSignatureSpy = jest
      .spyOn(mercadopagoIntegration, "validateWebhookSignature")
      .mockReturnValue(true);

    processWebhookSpy = jest
      .spyOn(webhookService, "processMercadoPagoWebhook")
      .mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should return 200 when signature is valid and processing succeeds", async () => {
    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(200);
  });

  it("should return 401 when signature is invalid", async () => {
    validateSignatureSpy.mockReturnValue(false);

    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(401);
    expect(processWebhookSpy).not.toHaveBeenCalled();
  });

  it("should pass correct args to validateWebhookSignature", async () => {
    await execute(buildEvent());

    expect(validateSignatureSpy).toHaveBeenCalledWith(
      "ts=1234,v1=validhash",
      "req-abc",
      "12345",
    );
  });

  it("should call processMercadoPagoWebhook with parsed body", async () => {
    await execute(buildEvent());

    expect(processWebhookSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "payment", data: { id: "12345" } }),
    );
  });

  it("should return 500 when service throws", async () => {
    processWebhookSpy.mockRejectedValue(new Error("Service error"));

    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(500);
  });

  it("should handle empty body without crashing", async () => {
    const result = await execute(buildEvent({ body: null }));

    expect([200, 401, 500]).toContain(result.statusCode);
  });

  it("should use empty string fallback for missing headers", async () => {
    await execute(buildEvent({ headers: {} }));

    expect(validateSignatureSpy).toHaveBeenCalledWith("", "", expect.any(String));
  });
});
