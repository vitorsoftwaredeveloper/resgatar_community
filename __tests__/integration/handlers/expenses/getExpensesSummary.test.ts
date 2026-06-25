import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as getExpensesSummaryServiceModule from "../../../../src/services/expenses/getExpensesSummary";
import { execute } from "../../../../src/handlers/expenses/getExpensesSummary";

const mockSummary = {
  year: 2026,
  month: 5,
  total: 470,
  count: 2,
  byCategory: { event: 350, food: 120 },
  expenses: [],
};

function buildEvent(
  query: Record<string, string> | null,
  token = "Bearer valid.token",
): APIGatewayEvent {
  return {
    queryStringParameters: query,
    headers: { authorization: token },
  } as any;
}

describe("getExpensesSummary handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let getExpensesSummaryServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "admin-id" } as any);

    getExpensesSummaryServiceSpy = jest
      .spyOn(getExpensesSummaryServiceModule, "getExpensesSummaryService")
      .mockResolvedValue(mockSummary as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 200 and the summary on success", async () => {
    const result = await execute(buildEvent({ year: "2026", month: "5" }));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.data.total).toBe(470);
    expect(body.data.count).toBe(2);
  });

  it("should call service with adminId, year and month", async () => {
    await execute(buildEvent({ year: "2026", month: "5" }));

    expect(getExpensesSummaryServiceSpy).toHaveBeenCalledWith(
      "admin-id",
      2026,
      5,
    );
  });

  it("should return 400 when month is out of range (12 is invalid — 0-11)", async () => {
    const result = await execute(buildEvent({ year: "2026", month: "12" }));

    expect(result.statusCode).toBe(400);
    expect(getExpensesSummaryServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when year is not a number", async () => {
    const result = await execute(buildEvent({ year: "abc", month: "5" }));

    expect(result.statusCode).toBe(400);
    expect(getExpensesSummaryServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when query params are absent", async () => {
    const result = await execute(buildEvent(null));

    expect(result.statusCode).toBe(400);
    expect(getExpensesSummaryServiceSpy).not.toHaveBeenCalled();
  });

  it("should propagate service statusCode (e.g. 401 for non-admin)", async () => {
    getExpensesSummaryServiceSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    const result = await execute(buildEvent({ year: "2026", month: "5" }));

    expect(result.statusCode).toBe(401);
  });

  it("should return 500 when service throws an unexpected error", async () => {
    getExpensesSummaryServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent({ year: "2026", month: "5" }));

    expect(result.statusCode).toBe(500);
  });
});
