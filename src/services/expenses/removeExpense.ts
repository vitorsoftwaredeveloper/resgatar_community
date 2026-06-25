import { ExpenseModel } from "../../models/Expense";
import { STATUS_CODE } from "../../constants";
import { verifyAdmin } from "../helper";

export const removeExpenseService = async (
  adminId: string,
  expenseId: string,
): Promise<void> => {
  console.log("IN - removeExpenseService");

  try {
    await verifyAdmin(adminId);

    const expense = await ExpenseModel.findById(expenseId);
    if (!expense) {
      throw {
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "Despesa não encontrada.",
      };
    }

    await ExpenseModel.deleteOne({ _id: expenseId });
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - removeExpenseService");
  }
};
