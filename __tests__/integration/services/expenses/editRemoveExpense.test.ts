import * as helperService from "../../../../src/services/helper";
import { ExpenseModel } from "../../../../src/models/Expense";
import { editExpenseService } from "../../../../src/services/expenses/editExpense";
import { removeExpenseService } from "../../../../src/services/expenses/removeExpense";

describe("editExpenseService (integration)", () => {
  let verifyAdminSpy: jest.SpyInstance;
  let findByIdSpy: jest.SpyInstance;
  let updateOneSpy: jest.SpyInstance;

  beforeEach(() => {
    verifyAdminSpy = jest
      .spyOn(helperService, "verifyAdmin")
      .mockResolvedValue(undefined);

    findByIdSpy = jest
      .spyOn(ExpenseModel, "findById")
      .mockResolvedValue({ _id: "expense-id", amount: "10,00" } as any);

    updateOneSpy = jest
      .spyOn(ExpenseModel, "updateOne")
      .mockResolvedValue({} as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should require admin access", async () => {
    await editExpenseService("admin-id", "expense-id", { amount: "20,00" });

    expect(verifyAdminSpy).toHaveBeenCalledWith("admin-id");
  });

  it("should throw 404 when the expense does not exist", async () => {
    findByIdSpy.mockResolvedValue(null);

    await expect(
      editExpenseService("admin-id", "missing", { amount: "20,00" }),
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(updateOneSpy).not.toHaveBeenCalled();
  });

  it("should only update the provided fields", async () => {
    await editExpenseService("admin-id", "expense-id", { amount: "20,00" });

    expect(updateOneSpy).toHaveBeenCalledWith(
      { _id: "expense-id" },
      { amount: "20,00" },
    );
  });
});

describe("removeExpenseService (integration)", () => {
  let verifyAdminSpy: jest.SpyInstance;
  let findByIdSpy: jest.SpyInstance;
  let deleteOneSpy: jest.SpyInstance;

  beforeEach(() => {
    verifyAdminSpy = jest
      .spyOn(helperService, "verifyAdmin")
      .mockResolvedValue(undefined);

    findByIdSpy = jest
      .spyOn(ExpenseModel, "findById")
      .mockResolvedValue({ _id: "expense-id" } as any);

    deleteOneSpy = jest
      .spyOn(ExpenseModel, "deleteOne")
      .mockResolvedValue({} as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should require admin access", async () => {
    await removeExpenseService("admin-id", "expense-id");

    expect(verifyAdminSpy).toHaveBeenCalledWith("admin-id");
  });

  it("should throw 404 when the expense does not exist", async () => {
    findByIdSpy.mockResolvedValue(null);

    await expect(
      removeExpenseService("admin-id", "missing"),
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(deleteOneSpy).not.toHaveBeenCalled();
  });

  it("should delete the expense when it exists", async () => {
    await removeExpenseService("admin-id", "expense-id");

    expect(deleteOneSpy).toHaveBeenCalledWith({ _id: "expense-id" });
  });
});
