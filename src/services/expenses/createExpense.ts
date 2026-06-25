import { ExpenseModel } from "../../models/Expense";
import { ICreateExpensePayload, IExpense } from "../../types/expenses";
import { verifyAdmin } from "../helper";

export const createExpenseService = async (
  adminId: string,
  payload: ICreateExpensePayload,
): Promise<string> => {
  console.log("IN - createExpenseService");

  try {
    await verifyAdmin(adminId);

    const expense: IExpense = {
      description: payload.description.trim(),
      amount: payload.amount,
      category: payload.category,
      referenceMonth: payload.referenceMonth,
      referenceYear: payload.referenceYear,
      date: payload.date,
      note: payload.note?.trim() || undefined,
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
