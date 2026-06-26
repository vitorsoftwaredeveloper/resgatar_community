import { ExpenseModel } from "../../models/Expense";
import { STATUS_CODE } from "../../constants";
import { generateReceiptViewUrl } from "../../utils/s3";
import { verifyAdmin } from "../helper";

export const getReceiptViewUrlService = async (
  adminId: string,
  expenseId: string,
): Promise<string> => {
  console.log("IN - getReceiptViewUrlService");

  try {
    await verifyAdmin(adminId);

    const expense = await ExpenseModel.findById(expenseId);
    if (!expense) {
      throw {
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "Despesa não encontrada.",
      };
    }

    if (!expense.receiptKey) {
      throw {
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "Despesa não possui recibo.",
      };
    }

    return await generateReceiptViewUrl(expense.receiptKey);
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - getReceiptViewUrlService");
  }
};
