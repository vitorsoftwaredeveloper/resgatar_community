import { APIGatewayEvent } from "aws-lambda";
import * as helperUtil from "../../../../src/utils/helper";
import * as createExpenseServiceModule from "../../../../src/services/expenses/createExpense";
import { execute } from "../../../../src/handlers/expenses/createExpense";
import { MAX_EXPENSE_DESCRIPTION_LENGTH } from "../../../../src/constants/expenses";

const validPayload = {
  description: "Aluguel do salão",
  amount: "350,00",
  category: "event",
  referenceMonth: 5,
  referenceYear: 2026,
  date: 1750000000000,
};

function buildEvent(body: any, token = "Bearer valid.token"): APIGatewayEvent {
  return {
    body: JSON.stringify(body),
    headers: { authorization: token },
  } as any;
}

describe("createExpense handler (integration)", () => {
  let decodeTokenSpy: jest.SpyInstance;
  let createExpenseServiceSpy: jest.SpyInstance;

  beforeEach(() => {
    decodeTokenSpy = jest
      .spyOn(helperUtil, "decodeToken")
      .mockReturnValue({ sub: "admin-id" } as any);

    createExpenseServiceSpy = jest
      .spyOn(createExpenseServiceModule, "createExpenseService")
      .mockResolvedValue("new-expense-id");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 201 and expense id on success", async () => {
    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.data._id).toBe("new-expense-id");
  });

  it("should pass adminId from token and payload to the service", async () => {
    await execute(buildEvent(validPayload));

    expect(createExpenseServiceSpy).toHaveBeenCalledWith(
      "admin-id",
      expect.objectContaining({ description: validPayload.description }),
    );
  });

  it("should return 400 when amount has an invalid format", async () => {
    const result = await execute(
      buildEvent({ ...validPayload, amount: "350.00" }),
    );

    expect(result.statusCode).toBe(400);
    expect(createExpenseServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when category is not in the allowed list", async () => {
    const result = await execute(
      buildEvent({ ...validPayload, category: "qualquer" }),
    );

    expect(result.statusCode).toBe(400);
    expect(createExpenseServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when referenceMonth is out of range", async () => {
    const result = await execute(
      buildEvent({ ...validPayload, referenceMonth: 12 }),
    );

    expect(result.statusCode).toBe(400);
    expect(createExpenseServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when a required field is missing", async () => {
    const { amount, ...withoutAmount } = validPayload;
    const result = await execute(buildEvent(withoutAmount));

    expect(result.statusCode).toBe(400);
    expect(createExpenseServiceSpy).not.toHaveBeenCalled();
  });

  it("should return 400 when description exceeds the max length", async () => {
    const tooLong = "a".repeat(MAX_EXPENSE_DESCRIPTION_LENGTH + 1);
    const result = await execute(
      buildEvent({ ...validPayload, description: tooLong }),
    );

    expect(result.statusCode).toBe(400);
    expect(createExpenseServiceSpy).not.toHaveBeenCalled();
  });

  it("should reject unknown fields (additionalProperties:false)", async () => {
    const result = await execute(
      buildEvent({ ...validPayload, adminId: "someone-else" }),
    );

    expect(result.statusCode).toBe(400);
    expect(createExpenseServiceSpy).not.toHaveBeenCalled();
  });

  it("should propagate the service statusCode (e.g. 401 for non-admin)", async () => {
    createExpenseServiceSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });
    const result = await execute(buildEvent(validPayload));

    expect(result.statusCode).toBe(401);
  });
});
