import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as createChargeServiceModule from "../../../../src/services/charges/createCharge";
import { execute } from "../../../../src/handlers/charges/createCharge";

const validPayload = {
  referenceMonth: 5,
};

const mockChargeDTO = {
  transactionId: 123456,
  memberId: "member-id",
  status: "pending",
  statusDetail: "pending_waiting_transfer",
  transactionAmount: "50,00",
  paymentMethodId: "pix",
  currencyId: "BRL",
  dateCreated: "2024-01-01T00:00:00.000Z",
  dateOfExpiration: "2024-01-02T00:00:00.000Z",
  payer: {
    firstName: "João",
    lastName: "Silva",
    email: "joao@email.com",
    identification: { type: "CPF", numberType: "ENC:mocked" },
  },
  transactionData: {
    qrCode: "qr-code-string",
    qrCodeBase64: "qr-code-base64",
    ticketUrl: "https://mpago.la/ticket",
  },
  referenceMonth: 5,
};

function buildEvent(body: any, token = "Bearer valid.token.here"): APIGatewayEvent {
  return {
    body: JSON.stringify(body),
    headers: { authorization: token },
  } as any;
}

describe("createCharge handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let createChargeServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "member-id-123" } as any);

    createChargeServiceSpy = jest
      .spyOn(createChargeServiceModule, "createChargeService")
      .mockResolvedValue(mockChargeDTO);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 201 and charge data on success", async () => {
    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.data.transactionId).toBe(mockChargeDTO.transactionId);
  });

  it("should call createChargeService with member sub and payload", async () => {
    await execute(buildEvent(validPayload));

    expect(createChargeServiceSpy).toHaveBeenCalledWith(
      "member-id-123",
      expect.objectContaining({ referenceMonth: 5 })
    );
  });

  it("should return 400 when referenceMonth is out of range", async () => {
    const result = await execute(buildEvent({ ...validPayload, referenceMonth: 12 }));

    expect(result.statusCode).toBe(400);
    expect(createChargeServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when required fields are missing", async () => {
    const result = await execute(buildEvent({}));

    expect(result.statusCode).toBe(400);
    expect(createChargeServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when transactionAmount is sent (no longer accepted)", async () => {
    const result = await execute(
      buildEvent({ ...validPayload, transactionAmount: "50,00" })
    );

    expect(result.statusCode).toBe(400);
    expect(createChargeServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when additional properties are sent", async () => {
    const result = await execute(buildEvent({ ...validPayload, extra: "field" }));

    expect(result.statusCode).toBe(400);
  });

  it("should return 500 when service throws unexpected error", async () => {
    createChargeServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(500);
  });

  it("should propagate statusCode from service error", async () => {
    createChargeServiceSpy.mockRejectedValue({
      statusCode: 404,
      message: "Member not found",
    });

    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(404);
  });

  it("should return 400 when body is null", async () => {
    const event = { body: null, headers: { authorization: "Bearer token" } } as any;
    const result = await execute(event);

    expect(result.statusCode).toBe(400);
    expect(createChargeServiceSpy).not.toHaveBeenCalled();
  });
});
