import { ExpenseModel } from "../../models/Expense";
import { STATUS_CODE } from "../../constants";
import { IEditExpensePayload } from "../../types/expenses";
import { deleteReceipt, isReceiptOwnedByAdmin } from "../../utils/s3";
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

    const update: any = {
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

    // Gerencia a troca/remoção do recibo: o objeto antigo no S3 só é
    // removido após a atualização do banco ser bem-sucedida.
    let receiptToDelete: string | undefined;
    if (payload.receiptKey !== undefined) {
      if (payload.receiptKey) {
        if (!isReceiptOwnedByAdmin(payload.receiptKey, adminId)) {
          throw {
            statusCode: STATUS_CODE.BAD_REQUEST,
            message: "receiptKey inválido.",
          };
        }
        update.receiptKey = payload.receiptKey;
        if (expense.receiptKey && expense.receiptKey !== payload.receiptKey) {
          receiptToDelete = expense.receiptKey;
        }
      } else {
        update.$unset = { receiptKey: "" };
        if (expense.receiptKey) {
          receiptToDelete = expense.receiptKey;
        }
      }
    }

    await ExpenseModel.updateOne({ _id: expenseId }, update);

    if (receiptToDelete) {
      await deleteReceipt(receiptToDelete);
    }
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - editExpenseService");
  }
};
