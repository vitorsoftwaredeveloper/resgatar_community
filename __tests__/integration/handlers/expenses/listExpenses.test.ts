import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as listExpensesServiceModule from "../../../../src/services/expenses/listExpenses";
import { execute } from "../../../../src/handlers/expenses/listExpenses";

const mockExpenses = [
  {
    _id: "exp-1",
    description: "Material de limpeza",
    amount: "120,00",
    category: "material",
    referenceMonth: 5,
    referenceYear: 2026,
    date: 1750000000000,
    adminId: "admin-id",
  },
];

function buildEvent(
  query: Record<string, string> | null,
  token = "Bearer valid.token",
): APIGatewayEvent {
  return {
    queryStringParameters: query,
    headers: { authorization: token },
  } as any;
}

describe("listExpenses handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let listExpensesServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "admin-id" } as any);

    listExpensesServiceSpy = jest
      .spyOn(listExpensesServiceModule, "listExpensesService")
      .mockResolvedValue(mockExpenses as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 200 and the expense list on success", async () => {
    const result = await execute(buildEvent({ year: "2026", month: "5" }));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]._id).toBe("exp-1");
  });

  it("should call service with adminId, year and month", async () => {
    await execute(buildEvent({ year: "2026", month: "5" }));

    expect(listExpensesServiceSpy).toHaveBeenCalledWith("admin-id", 2026, 5);
  });

  it("should return 400 when month is out of range (12)", async () => {
    const result = await execute(buildEvent({ year: "2026", month: "12" }));

    expect(result.statusCode).toBe(400);
    expect(listExpensesServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when month is negative", async () => {
    const result = await execute(buildEvent({ year: "2026", month: "-1" }));

    expect(result.statusCode).toBe(400);
    expect(listExpensesServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when year is not a number", async () => {
    const result = await execute(buildEvent({ year: "abc", month: "5" }));

    expect(result.statusCode).toBe(400);
    expect(listExpensesServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when query params are absent", async () => {
    const result = await execute(buildEvent(null));

    expect(result.statusCode).toBe(400);
    expect(listExpensesServiceSpy).not.toHaveBeenCalled();
  });

  it("should propagate service statusCode (e.g. 401 for non-admin)", async () => {
    listExpensesServiceSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    const result = await execute(buildEvent({ year: "2026", month: "5" }));

    expect(result.statusCode).toBe(401);
  });

  it("should return 500 when service throws an unexpected error", async () => {
    listExpensesServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent({ year: "2026", month: "5" }));

    expect(result.statusCode).toBe(500);
  });
});
