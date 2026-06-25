import { ExpenseModel } from "../../models/Expense";
import { IExpenseDTO, IExpensesSummary } from "../../types/expenses";
import { verifyAdmin } from "../helper";

const parseAmount = (value?: string | null): number => {
  if (!value) return 0;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

const toDTO = (expense: any): IExpenseDTO => ({
  _id: expense._id?.toString(),
  description: expense.description,
  amount: expense.amount,
  category: expense.category,
  referenceMonth: expense.referenceMonth,
  referenceYear: expense.referenceYear,
  date: expense.date,
  note: expense.note ?? undefined,
  adminId: expense.adminId,
});

export const getExpensesSummaryService = async (
  adminId: string,
  year: number,
  month: number,
): Promise<IExpensesSummary> => {
  console.log("IN - getExpensesSummaryService");

  try {
    await verifyAdmin(adminId);

    const expenses = await ExpenseModel.find(
      { referenceYear: year, referenceMonth: month },
      {},
      { lean: true, sort: { date: -1, createdAt: -1 } },
    );

    let total = 0;
    const byCategory: Record<string, number> = {};

    for (const expense of expenses) {
      const value = parseAmount(expense.amount);
      total += value;
      byCategory[expense.category] = round2(
        (byCategory[expense.category] ?? 0) + value,
      );
    }

    return {
      year,
      month,
      total: round2(total),
      count: expenses.length,
      byCategory,
      expenses: expenses.map(toDTO),
    };
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - getExpensesSummaryService");
  }
};
