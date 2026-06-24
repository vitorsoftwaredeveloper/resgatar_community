import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as registerCashPaymentServiceModule from "../../../../src/services/charges/registerCashPayment";
import { execute } from "../../../../src/handlers/charges/registerCashPayment";

const validPayload = {
  memberId: "target-member-id",
  referenceMonth: 5,
};

const mockResult = {
  referenceMonth: 5,
  year: 2026,
  paid: true,
  paidAt: new Date("2026-06-24T00:00:00.000Z"),
  value: "50,00",
  paymentMethod: "cash",
};

function buildEvent(
  body: any,
  token = "Bearer valid.token.here"
): APIGatewayEvent {
  return {
    body: JSON.stringify(body),
    headers: { authorization: token },
  } as any;
}

describe("registerCashPayment handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let registerCashPaymentServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "member-id-123" } as any);

    registerCashPaymentServiceSpy = jest
      .spyOn(registerCashPaymentServiceModule, "registerCashPaymentService")
      .mockResolvedValue(mockResult);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 201 and payment data on success", async () => {
    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.data.paymentMethod).toBe("cash");
  });

  it("should call service with caller sub (admin) and payload", async () => {
    await execute(buildEvent(validPayload));

    expect(registerCashPaymentServiceSpy).toHaveBeenCalledWith(
      "member-id-123",
      expect.objectContaining({
        memberId: "target-member-id",
        referenceMonth: 5,
      })
    );
  });

  it("should return 400 when referenceMonth is out of range", async () => {
    const result = await execute(
      buildEvent({ memberId: "target-member-id", referenceMonth: 12 })
    );

    expect(result.statusCode).toBe(400);
    expect(registerCashPaymentServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when memberId is missing", async () => {
    const result = await execute(buildEvent({ referenceMonth: 5 }));

    expect(result.statusCode).toBe(400);
    expect(registerCashPaymentServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when required fields are missing", async () => {
    const result = await execute(buildEvent({}));

    expect(result.statusCode).toBe(400);
    expect(registerCashPaymentServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when additional properties are sent", async () => {
    const result = await execute(buildEvent({ ...validPayload, extra: "field" }));

    expect(result.statusCode).toBe(400);
    expect(registerCashPaymentServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when body is null", async () => {
    const event = {
      body: null,
      headers: { authorization: "Bearer token" },
    } as any;
    const result = await execute(event);

    expect(result.statusCode).toBe(400);
    expect(registerCashPaymentServiceSpy).not.toHaveBeenCalled();
  });

  it("should propagate statusCode from service error", async () => {
    registerCashPaymentServiceSpy.mockRejectedValue({
      statusCode: 409,
      message: "Month is already paid",
    });

    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(409);
  });

  it("should return 500 when service throws unexpected error", async () => {
    registerCashPaymentServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(500);
  });
});
