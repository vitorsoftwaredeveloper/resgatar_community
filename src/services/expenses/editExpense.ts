import { ExpenseModel } from "../../models/Expense";
import { STATUS_CODE } from "../../constants";
import { IEditExpensePayload } from "../../types/expenses";
import { verifyAdmin } from "../helper";

export const editExpenseService = async (
  adminId: string,
  expenseId: string,
  payload: IEditExpensePayload,
): Promise<void> => {
  console.log("IN - editExpenseService");

  try {
    await verifyAdmin(adminId);

    const expense = await ExpenseModel.findById(expenseId);
    if (!expense) {
      throw {
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "Despesa não encontrada.",
      };
    }

    const update: IEditExpensePayload = {
      ...(payload.description !== undefined && {
        description: payload.description.trim(),
      }),
      ...(payload.amount !== undefined && { amount: payload.amount }),
      ...(payload.category !== undefined && { category: payload.category }),
      ...(payload.referenceMonth !== undefined && {
        referenceMonth: payload.referenceMonth,
      }),
      ...(payload.referenceYear !== undefined && {
        referenceYear: payload.referenceYear,
      }),
      ...(payload.date !== undefined && { date: payload.date }),
      ...(payload.note !== undefined && { note: payload.note?.trim() || "" }),
    };

    await ExpenseModel.updateOne({ _id: expenseId }, update);
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - editExpenseService");
  }
};
