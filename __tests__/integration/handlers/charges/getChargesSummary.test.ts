import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as getChargesSummaryServiceModule from "../../../../src/services/charges/getChargesSummary";
import { execute } from "../../../../src/handlers/charges/getChargesSummary";

const mockResult = {
  year: 2026,
  month: 6,
  goal: 225,
  collected: 150,
  remaining: 75,
  byMethod: { pix: 100, cash: 50 },
  counts: { paid: 2, pending: 1, total: 3 },
  members: [],
};

function buildEvent(
  query: Record<string, string> | null,
  token = "Bearer valid.token.here"
): APIGatewayEvent {
  return {
    queryStringParameters: query,
    headers: { authorization: token },
  } as any;
}

describe("getChargesSummary handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let getChargesSummaryServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "admin-id" } as any);

    getChargesSummaryServiceSpy = jest
      .spyOn(getChargesSummaryServiceModule, "getChargesSummaryService")
      .mockResolvedValue(mockResult as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 200 and summary data on success", async () => {
    const result = await execute(buildEvent({ year: "2026", month: "6" }));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.data.goal).toBe(225);
  });

  it("should call service with caller sub, year and month", async () => {
    await execute(buildEvent({ year: "2026", month: "6" }));

    expect(getChargesSummaryServiceSpy).toHaveBeenCalledWith("admin-id", 2026, 6);
  });

  it("should default to current year and month when query is absent", async () => {
    const now = new Date();
    await execute(buildEvent(null));

    expect(getChargesSummaryServiceSpy).toHaveBeenCalledWith(
      "admin-id",
      now.getFullYear(),
      now.getMonth() + 1
    );
  });

  it("should return 400 when month is out of range", async () => {
    const result = await execute(buildEvent({ year: "2026", month: "13" }));

    expect(result.statusCode).toBe(400);
    expect(getChargesSummaryServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when year is not a number", async () => {
    const result = await execute(buildEvent({ year: "abc", month: "6" }));

    expect(result.statusCode).toBe(400);
    expect(getChargesSummaryServiceSpy).not.toHaveBeenCalled();
  });

  it("should propagate statusCode from service error", async () => {
    getChargesSummaryServiceSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    const result = await execute(buildEvent({ year: "2026", month: "6" }));

    expect(result.statusCode).toBe(401);
  });

  it("should return 500 when service throws unexpected error", async () => {
    getChargesSummaryServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent({ year: "2026", month: "6" }));

    expect(result.statusCode).toBe(500);
  });
});
