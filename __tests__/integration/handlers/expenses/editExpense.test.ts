import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as editExpenseServiceModule from "../../../../src/services/expenses/editExpense";
import { execute } from "../../../../src/handlers/expenses/editExpense";

function buildEvent(
  expenseId: string | undefined,
  body: any,
  token = "Bearer valid.token",
): APIGatewayEvent {
  return {
    pathParameters: expenseId ? { expenseId } : null,
    body: JSON.stringify(body),
    headers: { authorization: token },
  } as any;
}

describe("editExpense handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let editExpenseServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "admin-id" } as any);

    editExpenseServiceSpy = jest
      .spyOn(editExpenseServiceModule, "editExpenseService")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 204 on success", async () => {
    const result = await execute(
      buildEvent("exp-id", { amount: "200,00" }),
    );

    expect(result.statusCode).toBe(204);
  });

  it("should call service with adminId, expenseId and payload", async () => {
    await execute(buildEvent("exp-id", { amount: "200,00" }));

    expect(editExpenseServiceSpy).toHaveBeenCalledWith(
      "admin-id",
      "exp-id",
      expect.objectContaining({ amount: "200,00" }),
    );
  });

  it("should return 400 when expenseId path param is missing", async () => {
    const result = await execute(buildEvent(undefined, { amount: "200,00" }));

    expect(result.statusCode).toBe(400);
    expect(editExpenseServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when amount has an invalid format", async () => {
    const result = await execute(
      buildEvent("exp-id", { amount: "200.00" }),
    );

    expect(result.statusCode).toBe(400);
    expect(editExpenseServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when category is not in the allowed list", async () => {
    const result = await execute(
      buildEvent("exp-id", { category: "invalid" }),
    );

    expect(result.statusCode).toBe(400);
    expect(editExpenseServiceSpy).not.toHaveBeenCalled();
  });

  it("should reject unknown fields (additionalProperties:false)", async () => {
    const result = await execute(
      buildEvent("exp-id", { adminId: "hacker" }),
    );

    expect(result.statusCode).toBe(400);
    expect(editExpenseServiceSpy).not.toHaveBeenCalled();
  });

  it("should accept an empty body (all fields optional)", async () => {
    const result = await execute(buildEvent("exp-id", {}));

    expect(result.statusCode).toBe(204);
  });

  it("should return 404 when the expense does not exist", async () => {
    editExpenseServiceSpy.mockRejectedValue({
      statusCode: 404,
      message: "Expense not found",
    });

    const result = await execute(buildEvent("missing-id", { amount: "10,00" }));

    expect(result.statusCode).toBe(404);
  });

  it("should propagate service statusCode (e.g. 401 for non-admin)", async () => {
    editExpenseServiceSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    const result = await execute(buildEvent("exp-id", { amount: "10,00" }));

    expect(result.statusCode).toBe(401);
  });

  it("should return 500 when service throws an unexpected error", async () => {
    editExpenseServiceSpy.mockRejectedValue(new Error("Unexpected"));

    const result = await execute(buildEvent("exp-id", { amount: "10,00" }));

    expect(result.statusCode).toBe(500);
  });
});
