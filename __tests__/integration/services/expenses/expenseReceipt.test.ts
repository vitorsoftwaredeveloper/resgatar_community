import * as helperService from "../../../../src/services/helper";
import * as s3Util from "../../../../src/utils/s3";
import { ExpenseModel } from "../../../../src/models/Expense";
import { createExpenseService } from "../../../../src/services/expenses/createExpense";
import { editExpenseService } from "../../../../src/services/expenses/editExpense";
import { removeExpenseService } from "../../../../src/services/expenses/removeExpense";
import { ICreateExpensePayload } from "../../../../src/types/expenses";

const basePayload: ICreateExpensePayload = {
  description: "Aluguel do salão",
  amount: "350,00",
  category: "event",
  referenceMonth: 5,
  referenceYear: 2026,
  date: 1750000000000,
};

const OWN_KEY = "receipts/admin-id/own.jpg";
const FOREIGN_KEY = "receipts/other-admin/foreign.jpg";

beforeEach(() => {
  jest.spyOn(helperService, "verifyAdmin").mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("createExpenseService — receipt", () => {
  let insertOneSpy: jest.SpyInstance;

  beforeEach(() => {
    insertOneSpy = jest
      .spyOn(ExpenseModel, "insertOne")
      .mockResolvedValue({ _id: "expense-id" } as any);
  });

  it("should persist the receiptKey when it belongs to the admin", async () => {
    await createExpenseService("admin-id", {
      ...basePayload,
      receiptKey: OWN_KEY,
    });

    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({ receiptKey: OWN_KEY }),
    );
  });

  it("should store undefined receiptKey when none is provided", async () => {
    await createExpenseService("admin-id", { ...basePayload });

    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({ receiptKey: undefined }),
    );
  });

  it("should reject a receiptKey owned by another admin", async () => {
    await expect(
      createExpenseService("admin-id", {
        ...basePayload,
        receiptKey: FOREIGN_KEY,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(insertOneSpy).not.toHaveBeenCalled();
  });
});

describe("editExpenseService — receipt", () => {
  let findByIdSpy: jest.SpyInstance;
  let updateOneSpy: jest.SpyInstance;
  let deleteReceiptSpy: jest.SpyInstance;

  beforeEach(() => {
    findByIdSpy = jest.spyOn(ExpenseModel, "findById");
    updateOneSpy = jest
      .spyOn(ExpenseModel, "updateOne")
      .mockResolvedValue({} as any);
    deleteReceiptSpy = jest
      .spyOn(s3Util, "deleteReceipt")
      .mockResolvedValue(undefined);
  });

  it("should set the new receiptKey and delete the previous object", async () => {
    findByIdSpy.mockResolvedValue({
      _id: "expense-id",
      receiptKey: "receipts/admin-id/old.jpg",
    } as any);

    await editExpenseService("admin-id", "expense-id", { receiptKey: OWN_KEY });

    expect(updateOneSpy).toHaveBeenCalledWith(
      { _id: "expense-id" },
      expect.objectContaining({ receiptKey: OWN_KEY }),
    );
    expect(deleteReceiptSpy).toHaveBeenCalledWith("receipts/admin-id/old.jpg");
  });

  it("should not delete anything when there was no previous receipt", async () => {
    findByIdSpy.mockResolvedValue({ _id: "expense-id" } as any);

    await editExpenseService("admin-id", "expense-id", { receiptKey: OWN_KEY });

    expect(deleteReceiptSpy).not.toHaveBeenCalled();
  });

  it("should unset the receipt and delete the object when receiptKey is empty", async () => {
    findByIdSpy.mockResolvedValue({
      _id: "expense-id",
      receiptKey: "receipts/admin-id/old.jpg",
    } as any);

    await editExpenseService("admin-id", "expense-id", { receiptKey: "" });

    expect(updateOneSpy).toHaveBeenCalledWith(
      { _id: "expense-id" },
      expect.objectContaining({ $unset: { receiptKey: "" } }),
    );
    expect(deleteReceiptSpy).toHaveBeenCalledWith("receipts/admin-id/old.jpg");
  });

  it("should reject a receiptKey owned by another admin and not touch the db/s3", async () => {
    findByIdSpy.mockResolvedValue({
      _id: "expense-id",
      receiptKey: "receipts/admin-id/old.jpg",
    } as any);

    await expect(
      editExpenseService("admin-id", "expense-id", { receiptKey: FOREIGN_KEY }),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(updateOneSpy).not.toHaveBeenCalled();
    expect(deleteReceiptSpy).not.toHaveBeenCalled();
  });

  it("should delete the old object only after a successful db update", async () => {
    findByIdSpy.mockResolvedValue({
      _id: "expense-id",
      receiptKey: "receipts/admin-id/old.jpg",
    } as any);
    updateOneSpy.mockRejectedValue(new Error("db down"));

    await expect(
      editExpenseService("admin-id", "expense-id", { receiptKey: OWN_KEY }),
    ).rejects.toThrow("db down");

    expect(deleteReceiptSpy).not.toHaveBeenCalled();
  });
});

describe("removeExpenseService — receipt", () => {
  let findByIdSpy: jest.SpyInstance;
  let deleteOneSpy: jest.SpyInstance;
  let deleteReceiptSpy: jest.SpyInstance;

  beforeEach(() => {
    findByIdSpy = jest.spyOn(ExpenseModel, "findById");
    deleteOneSpy = jest
      .spyOn(ExpenseModel, "deleteOne")
      .mockResolvedValue({} as any);
    deleteReceiptSpy = jest
      .spyOn(s3Util, "deleteReceipt")
      .mockResolvedValue(undefined);
  });

  it("should delete the receipt object when the expense has one", async () => {
    findByIdSpy.mockResolvedValue({
      _id: "expense-id",
      receiptKey: OWN_KEY,
    } as any);

    await removeExpenseService("admin-id", "expense-id");

    expect(deleteOneSpy).toHaveBeenCalledWith({ _id: "expense-id" });
    expect(deleteReceiptSpy).toHaveBeenCalledWith(OWN_KEY);
  });

  it("should not call the s3 delete when there is no receipt", async () => {
    findByIdSpy.mockResolvedValue({ _id: "expense-id" } as any);

    await removeExpenseService("admin-id", "expense-id");

    expect(deleteReceiptSpy).not.toHaveBeenCalled();
  });
});
