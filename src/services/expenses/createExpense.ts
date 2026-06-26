import { ExpenseModel } from "../../models/Expense";
import { STATUS_CODE } from "../../constants";
import { ICreateExpensePayload, IExpense } from "../../types/expenses";
import { isReceiptOwnedByAdmin } from "../../utils/s3";
import { verifyAdmin } from "../helper";

export const createExpenseService = async (
  adminId: string,
  payload: ICreateExpensePayload,
): Promise<string> => {
  console.log("IN - createExpenseService");

  try {
    await verifyAdmin(adminId);

    if (payload.receiptKey && !isReceiptOwnedByAdmin(payload.receiptKey, adminId)) {
      throw {
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "receiptKey inválido.",
      };
    }

    const expense: IExpense = {
      description: payload.description.trim(),
      amount: payload.amount,
      category: payload.category,
      referenceMonth: payload.referenceMonth,
      referenceYear: payload.referenceYear,
      date: payload.date,
      note: payload.note?.trim() || undefined,
      receiptKey: payload.receiptKey || undefined,
      adminId: adminId,
    };

    const created: any = await ExpenseModel.insertOne(expense);

    return created._id?.toString();
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - createExpenseService");
  }
};
