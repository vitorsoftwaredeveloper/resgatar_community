import { ExpenseModel } from "../../models/Expense";
import { IExpenseDTO } from "../../types/expenses";
import { verifyAdmin } from "../helper";

const toDTO = (expense: any): IExpenseDTO => ({
  _id: expense._id?.toString(),
  description: expense.description,
  amount: expense.amount,
  category: expense.category,
  referenceMonth: expense.referenceMonth,
  referenceYear: expense.referenceYear,
  date: expense.date,
  note: expense.note ?? undefined,
  receiptKey: expense.receiptKey ?? undefined,
  adminId: expense.adminId,
});

export const listExpensesService = async (
  adminId: string,
  year: number,
  month: number,
): Promise<IExpenseDTO[]> => {
  console.log("IN - listExpensesService");

  try {
    await verifyAdmin(adminId);

    const expenses = await ExpenseModel.find(
      { referenceYear: year, referenceMonth: month },
      {},
      { lean: true, sort: { date: -1, createdAt: -1 } },
    );

    return expenses.map(toDTO);
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - listExpensesService");
  }
};
