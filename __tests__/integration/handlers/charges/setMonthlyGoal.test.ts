import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as setMonthlyGoalServiceModule from "../../../../src/services/charges/setMonthlyGoal";
import { execute } from "../../../../src/handlers/charges/setMonthlyGoal";

const validPayload = {
  year: 2026,
  month: 6,
  amount: "2500,00",
};

function buildEvent(body: any, token = "Bearer valid.token"): APIGatewayEvent {
  return {
    body: JSON.stringify(body),
    headers: { authorization: token },
  } as any;
}

describe("setMonthlyGoal handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let setMonthlyGoalServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "admin-id" } as any);

    setMonthlyGoalServiceSpy = jest
      .spyOn(setMonthlyGoalServiceModule, "setMonthlyGoalService")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 200 on success", async () => {
    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(200);
  });

  it("should pass adminId from token and payload to the service", async () => {
    await execute(buildEvent(validPayload));

    expect(setMonthlyGoalServiceSpy).toHaveBeenCalledWith(
      "admin-id",
      expect.objectContaining({ year: 2026, month: 6, amount: "2500,00" }),
    );
  });

  it("should return 400 when amount has an invalid format", async () => {
    const result = await execute(
      buildEvent({ ...validPayload, amount: "2500.00" }),
    );

    expect(result.statusCode).toBe(400);
    expect(setMonthlyGoalServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when month is out of range", async () => {
    const result = await execute(buildEvent({ ...validPayload, month: 13 }));

    expect(result.statusCode).toBe(400);
    expect(setMonthlyGoalServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when month is zero (expects 1-indexed)", async () => {
    const result = await execute(buildEvent({ ...validPayload, month: 0 }));

    expect(result.statusCode).toBe(400);
    expect(setMonthlyGoalServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when a required field is missing", async () => {
    const { amount, ...withoutAmount } = validPayload;
    const result = await execute(buildEvent(withoutAmount));

    expect(result.statusCode).toBe(400);
    expect(setMonthlyGoalServiceSpy).not.toHaveBeenCalled();
  });

  it("should reject unknown fields (additionalProperties:false)", async () => {
    const result = await execute(
      buildEvent({ ...validPayload, adminId: "someone-else" }),
    );

    expect(result.statusCode).toBe(400);
    expect(setMonthlyGoalServiceSpy).not.toHaveBeenCalled();
  });

  it("should propagate the service statusCode (e.g. 401 for non-admin)", async () => {
    setMonthlyGoalServiceSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(401);
  });
});
