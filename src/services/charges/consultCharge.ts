import { ChargeModel } from "../../models/Charge";
import { STATUS_CODE } from "../../constants";
import { findMemberById } from "../helper";

export const consultChargeService = async (
  memberId: string,
  transactionId: string,
): Promise<any> => {
  console.log("IN - consultChargeService");

  await findMemberById(memberId);

  try {
    const charge = await ChargeModel.findOne({ transactionId });

    if (!charge) {
      throw {
        message: "Charge not found",
        statusCode: STATUS_CODE.NOT_FOUND,
      };
    }

    return charge;
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - consultChargeService");
  }
};
