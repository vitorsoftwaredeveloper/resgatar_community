import { MonthlyGoalModel } from "../../models/MonthlyGoal";
import { ISetMonthlyGoalPayload } from "../../types/charges";
import { verifyAdmin } from "../helper";

export const setMonthlyGoalService = async (
  adminId: string,
  payload: ISetMonthlyGoalPayload,
): Promise<void> => {
  console.log("IN - setMonthlyGoalService");

  try {
    await verifyAdmin(adminId);

    // Mês público é 1-indexado; a coleção guarda 0-indexado (0 = janeiro).
    const referenceMonth = payload.month - 1;

    await MonthlyGoalModel.updateOne(
      { referenceYear: payload.year, referenceMonth },
      {
        $set: { amount: payload.amount, adminId },
        $setOnInsert: {
          referenceYear: payload.year,
          referenceMonth,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - setMonthlyGoalService");
  }
};
