import * as helperService from "../../../../src/services/helper";
import { ExpenseModel } from "../../../../src/models/Expense";
import { createExpenseService } from "../../../../src/services/expenses/createExpense";
import { ICreateExpensePayload } from "../../../../src/types/expenses";

const basePayload: ICreateExpensePayload = {
  description: "  Aluguel do salão  ",
  amount: "350,00",
  category: "event",
  referenceMonth: 5,
  referenceYear: 2026,
  date: 1750000000000,
};

describe("createExpenseService (integration)", () => {
  let verifyAdminSpy: jest.SpyInstance;
  let insertOneSpy: jest.SpyInstance;

  beforeEach(() => {
    verifyAdminSpy = jest
      .spyOn(helperService, "verifyAdmin")
      .mockResolvedValue(undefined);

    insertOneSpy = jest
      .spyOn(ExpenseModel, "insertOne")
      .mockResolvedValue({ _id: "expense-id-123" } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should verify the requester is an admin before creating", async () => {
    await createExpenseService("admin-id", { ...basePayload });

    expect(verifyAdminSpy).toHaveBeenCalledWith("admin-id");
  });

  it("should not create the expense when verifyAdmin rejects", async () => {
    verifyAdminSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    await expect(
      createExpenseService("not-admin", { ...basePayload }),
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(insertOneSpy).not.toHaveBeenCalled();
  });

  it("should set adminId to the admin id and trim the description", async () => {
    await createExpenseService("admin-id", { ...basePayload });

    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Aluguel do salão",
        adminId: "admin-id",
        category: "event",
        amount: "350,00",
      }),
    );
  });

  it("should return the created expense id", async () => {
    const id = await createExpenseService("admin-id", { ...basePayload });

    expect(id).toBe("expense-id-123");
  });
});
