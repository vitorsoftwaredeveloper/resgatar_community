import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as getGoalProgressServiceModule from "../../../../src/services/charges/getGoalProgress";
import { execute } from "../../../../src/handlers/charges/getGoalProgress";

const mockResult = {
  year: 2026,
  month: 6,
  targetGoal: 2000,
  achieved: 150,
  goalReached: false,
  achievedPercent: 7.5,
  dues: 225,
  collected: 150,
  donations: 0,
  expenses: 0,
  remaining: 1850,
  donationItems: [],
  expenseItems: [],
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
  let decodeTokenSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "member-id-123" } as any);

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
    expect(body.data.achievedPercent).toBe(7.5);
  });

  it("should call service with the caller id, year and month", async () => {
    await execute(buildEvent({ year: "2026", month: "6" }));

    expect(getGoalProgressServiceSpy).toHaveBeenCalledWith(
      "member-id-123",
      2026,
      6,
    );
  });

  it("should default to current year and month when query is absent", async () => {
    const now = new Date();
    await execute(buildEvent(null));

    expect(getGoalProgressServiceSpy).toHaveBeenCalledWith(
      "member-id-123",
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

  it("should decode the authorization header", async () => {
    await execute(buildEvent({ year: "2026", month: "6" }));

    expect(decodeTokenSpy).toHaveBeenCalledWith("Bearer valid.token.here");
  });

  it("should propagate 401 when the service rejects a guest", async () => {
    getGoalProgressServiceSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    const result = await execute(buildEvent({ year: "2026", month: "6" }));

    expect(result.statusCode).toBe(401);
  });
});
