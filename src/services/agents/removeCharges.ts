import { TRANSACTION_STATUS } from "../../constants/charges";
import { ChargeModel } from "../../models/Charge";

export const execute = async () => {
  try {
    console.log("IN - removeCharges");

    const result = await ChargeModel.deleteMany({
      status: {
        $in: [TRANSACTION_STATUS.PENDING, TRANSACTION_STATUS.REJECTED],
      },
    });

    console.log("Deleted charges:", result.deletedCount);
  } catch (error) {
    console.error("Error removing charges", error);
  } finally {
    console.log("OUT - removeCharges");
  }
};
