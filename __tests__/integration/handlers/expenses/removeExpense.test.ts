import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as removeExpenseServiceModule from "../../../../src/services/expenses/removeExpense";
import { execute } from "../../../../src/handlers/expenses/removeExpense";

function buildEvent(
  expenseId?: string,
  token = "Bearer valid.token",
): APIGatewayEvent {
  return {
    pathParameters: expenseId ? { expenseId } : null,
    headers: { authorization: token },
  } as any;
}

describe("removeExpense handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let removeExpenseServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "admin-id" } as any);

    removeExpenseServiceSpy = jest
      .spyOn(removeExpenseServiceModule, "removeExpenseService")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 204 on success", async () => {
    const result = await execute(buildEvent("exp-id"));

    expect(result.statusCode).toBe(204);
  });

  it("should call service with adminId and expenseId", async () => {
    await execute(buildEvent("exp-id"));

    expect(removeExpenseServiceSpy).toHaveBeenCalledWith("admin-id", "exp-id");
  });

  it("should return 400 when expenseId path param is missing", async () => {
    const result = await execute(buildEvent());

    expect(result.statusCode).toBe(400);
    expect(removeExpenseServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 404 when the expense is not found", async () => {
    removeExpenseServiceSpy.mockRejectedValue({
      statusCode: 404,
      message: "Expense not found",
    });

    const result = await execute(buildEvent("missing-id"));

    expect(result.statusCode).toBe(404);
  });

  it("should propagate service statusCode (e.g. 401 for non-admin)", async () => {
    removeExpenseServiceSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    const result = await execute(buildEvent("exp-id"));

    expect(result.statusCode).toBe(401);
  });

  it("should return 500 when service throws an unexpected error", async () => {
    removeExpenseServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent("exp-id"));

    expect(result.statusCode).toBe(500);
  });
});
