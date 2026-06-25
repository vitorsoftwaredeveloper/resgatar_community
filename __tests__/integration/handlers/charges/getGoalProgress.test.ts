import { APIGatewayEvent } from "aws-lambda";
import * as getGoalProgressServiceModule from "../../../../src/services/charges/getGoalProgress";
import { execute } from "../../../../src/handlers/charges/getGoalProgress";

const mockResult = {
  year: 2026,
  month: 6,
  goal: 225,
  collected: 150,
  remaining: 75,
  percent: 66.67,
};

function buildEvent(
  query: Record<string, string> | null,
  token = "Bearer valid.token.here",
): APIGatewayEvent {
  return {
    queryStringParameters: query,
    headers: { authorization: token },
  } as any;
}

describe("getGoalProgress handler (integration)", () => {
  let getGoalProgressServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    getGoalProgressServiceSpy = jest
      .spyOn(getGoalProgressServiceModule, "getGoalProgressService")
      .mockResolvedValue(mockResult);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 200 and progress data on success", async () => {
    const result = await execute(buildEvent({ year: "2026", month: "6" }));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.data.percent).toBe(66.67);
  });

  it("should call service with year and month", async () => {
    await execute(buildEvent({ year: "2026", month: "6" }));

    expect(getGoalProgressServiceSpy).toHaveBeenCalledWith(2026, 6);
  });

  it("should default to current year and month when query is absent", async () => {
    const now = new Date();
    await execute(buildEvent(null));

    expect(getGoalProgressServiceSpy).toHaveBeenCalledWith(
      now.getFullYear(),
      now.getMonth() + 1,
    );
  });

  it("should return 400 when month is out of range", async () => {
    const result = await execute(buildEvent({ year: "2026", month: "13" }));

    expect(result.statusCode).toBe(400);
    expect(getGoalProgressServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when year is not a number", async () => {
    const result = await execute(buildEvent({ year: "abc", month: "6" }));

    expect(result.statusCode).toBe(400);
    expect(getGoalProgressServiceSpy).not.toHaveBeenCalled();
  });

  it("should propagate statusCode from service error", async () => {
    getGoalProgressServiceSpy.mockRejectedValue({
      statusCode: 400,
      message: "Invalid month",
    });

    const result = await execute(buildEvent({ year: "2026", month: "6" }));

    expect(result.statusCode).toBe(400);
  });

  it("should return 500 when service throws unexpected error", async () => {
    getGoalProgressServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent({ year: "2026", month: "6" }));

    expect(result.statusCode).toBe(500);
  });

  it("should not require admin — handler has no decodeToken call", async () => {
    // Handler does not call decodeToken, so any authenticated request works.
    const result = await execute(buildEvent({ year: "2026", month: "6" }));

    expect(result.statusCode).toBe(200);
  });
});
