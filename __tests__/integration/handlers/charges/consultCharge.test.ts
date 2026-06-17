import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as consultChargeServiceModule from "../../../../src/services/charges/consultCharge";
import { execute } from "../../../../src/handlers/charges/consultCharge";

const mockCharge = {
  transactionId: 123456,
  memberId: "member-id",
  status: "pending",
  statusDetail: "pending_waiting_transfer",
  transactionAmount: "50,00",
  referenceMonth: 5,
  transactionData: {
    qrCode: "qr-code-string",
    qrCodeBase64: "qr-code-base64",
    ticketUrl: "https://mpago.la/ticket",
  },
};

function buildEvent(transactionId = "123456", token = "Bearer valid.token.here"): APIGatewayEvent {
  return {
    headers: { authorization: token },
    pathParameters: { transactionId },
  } as any;
}

describe("consultCharge handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let consultChargeServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "member-id-123" } as any);

    consultChargeServiceSpy = jest
      .spyOn(consultChargeServiceModule, "consultChargeService")
      .mockResolvedValue(mockCharge);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 201 and charge data on success", async () => {
    const result = await execute(buildEvent("123456"));

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.data.transactionId).toBe(mockCharge.transactionId);
  });

  it("should call consultChargeService with member sub and transactionId", async () => {
    await execute(buildEvent("123456"));

    expect(consultChargeServiceSpy).toHaveBeenCalledWith("member-id-123", "123456");
  });

  it("should return 404 when charge is not found", async () => {
    consultChargeServiceSpy.mockRejectedValue({
      statusCode: 404,
      message: "Charge not found",
    });

    const result = await execute(buildEvent("999"));

    expect(result.statusCode).toBe(404);
  });

  it("should return 500 when service throws unexpected error", async () => {
    consultChargeServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent("123456"));

    expect(result.statusCode).toBe(500);
  });

  it("should propagate statusCode from service error", async () => {
    consultChargeServiceSpy.mockRejectedValue({
      statusCode: 403,
      message: "Unauthorized",
    });

    const result = await execute(buildEvent("123456"));

    expect(result.statusCode).toBe(403);
  });
});
