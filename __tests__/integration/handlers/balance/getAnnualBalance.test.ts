import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as getAnnualBalanceServiceModule from "../../../../src/services/balance/getAnnualBalance";
import { execute } from "../../../../src/handlers/balance/getAnnualBalance";

const mockBalance = {
  year: 2026,
  asOfMonth: 3,
  totals: { entradas: 900, saidas: 200, resultado: 700, saldoFinal: 700 },
  byMonth: [
    { month: 1, entradas: 300, saidas: 0, resultado: 300, saldoAcumulado: 300 },
    { month: 2, entradas: 300, saidas: 100, resultado: 200, saldoAcumulado: 500 },
    { month: 3, entradas: 300, saidas: 100, resultado: 200, saldoAcumulado: 700 },
  ],
  expensesByCategory: { event: 100, food: 100 },
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

describe("getAnnualBalance handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let getAnnualBalanceServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "admin-id" } as any);

    getAnnualBalanceServiceSpy = jest
      .spyOn(getAnnualBalanceServiceModule, "getAnnualBalanceService")
      .mockResolvedValue(mockBalance as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 200 and the annual balance on success", async () => {
    const result = await execute(buildEvent({ year: "2026" }));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.data.year).toBe(2026);
    expect(body.data.totals.saldoFinal).toBe(700);
    expect(body.data.byMonth).toHaveLength(3);
  });

  it("should call service with adminId and the provided year", async () => {
    await execute(buildEvent({ year: "2026" }));

    expect(getAnnualBalanceServiceSpy).toHaveBeenCalledWith("admin-id", 2026);
  });

  it("should default to the current year when no query param is provided", async () => {
    const currentYear = new Date().getFullYear();

    await execute(buildEvent(null));

    expect(getAnnualBalanceServiceSpy).toHaveBeenCalledWith(
      "admin-id",
      currentYear,
    );
  });

  it("should propagate service statusCode (e.g. 401 for non-admin)", async () => {
    getAnnualBalanceServiceSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    const result = await execute(buildEvent({ year: "2026" }));

    expect(result.statusCode).toBe(401);
  });

  it("should return 500 when service throws an unexpected error", async () => {
    getAnnualBalanceServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent({ year: "2026" }));

    expect(result.statusCode).toBe(500);
  });
});
