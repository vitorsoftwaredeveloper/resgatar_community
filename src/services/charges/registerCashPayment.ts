import { ContributionModel } from "../../models/Contribution";
import { IMember } from "../../types/members";
import { IRegisterCashPaymentPayload } from "../../types/charges";
import { findMemberById, verifyAdmin } from "../helper";
import { notifyPaymentConfirmed } from "../notifications/notifyPaymentConfirmed";
import { STATUS_CODE } from "../../constants";
import {
  CONTRIBUTION_PAYMENT_METHOD,
  MONTH_KEYS,
} from "../../constants/charges";

export const registerCashPaymentService = async (
  adminId: string,
  payload: IRegisterCashPaymentPayload,
): Promise<any> => {
  console.log("IN - registerCashPaymentService");

  try {
    await verifyAdmin(adminId);

    const { memberId } = payload;
    const member: IMember = await findMemberById(memberId);

    const year = new Date().getFullYear();
    const monthKey = MONTH_KEYS[payload.referenceMonth];

    const contribution = await ContributionModel.findOne(
      { memberId, year },
      { months: 1 },
      { lean: true },
    );

    if (!contribution || !contribution.months?.[monthKey]) {
      throw {
        message: "Contribution month not found",
        statusCode: STATUS_CODE.NOT_FOUND,
      };
    }

    if (contribution.months[monthKey].paid) {
      throw {
        message: "Month is already paid",
        statusCode: STATUS_CODE.CONFLICT,
      };
    }

    const paidAt = new Date();
    const value = payload.value ?? member.paymentInfo.amount;

    await ContributionModel.updateOne(
      { memberId, year },
      {
        $set: {
          [`months.${monthKey}.paid`]: true,
          [`months.${monthKey}.paidAt`]: paidAt,
          [`months.${monthKey}.value`]: value,
          [`months.${monthKey}.paymentMethod`]:
            CONTRIBUTION_PAYMENT_METHOD.CASH,
        },
      },
    );

    await notifyPaymentConfirmed(
      member.pushTokens,
      CONTRIBUTION_PAYMENT_METHOD.CASH,
    );

    return {
      referenceMonth: payload.referenceMonth,
      year,
      paid: true,
      paidAt,
      value,
      paymentMethod: CONTRIBUTION_PAYMENT_METHOD.CASH,
    };
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - registerCashPaymentService");
  }
};
