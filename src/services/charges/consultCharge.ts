import { ChargeModel } from "../../models/Charge";
import { createMercadoPagoClient } from "../../integrations/mercadopago";
import { STATUS_CODE } from "../../constants";
import { findMemberById } from "../members/helper";
import { TRANSACTION_STATUS } from "../../constants/charges";
import { IChargeDTO, IConsultChargeMPagoResponse } from "../../types/charges";
import { ContributionModel } from "../../models/Contribution";

export const consultChargeService = async (
  memberId: string,
  transactionId: string
): Promise<any> => {
  console.log("IN - consultChargeService");

  await findMemberById(memberId);

  try {
    const mpClient = await createMercadoPagoClient();

    const charge = await ChargeModel.findOne({ transactionId });

    if (!charge) {
      throw {
        message: "Charge not found",
        statusCode: STATUS_CODE.NOT_FOUND,
      };
    }

    let response: any = null;
    if (charge.status === TRANSACTION_STATUS.PENDING) {
      response = await mpClient.consultPayment(transactionId);

      await updateCharge(charge, response);
    }

    return { ...charge, ...(response && { status: response.status }) };
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - consultChargeService");
  }
};

const updateCharge = async (
  charge: IChargeDTO,
  chargeConsulted: IConsultChargeMPagoResponse
) => {
  console.log("IN - updateCharge");

  if (charge.status !== chargeConsulted.status) {
    await ChargeModel.updateOne(
      { transactionId: charge.transactionId },
      {
        $set: {
          statusDetail: chargeConsulted.status_detail,
          dateApproved: chargeConsulted.date_approved,
        },
      }
    );

    const monthKey = getMonthKeyFromDate(charge.dateCreated);

    await ContributionModel.updateOne(
      {
        memberId: charge.memberId,
        year: new Date(charge.dateCreated).getFullYear(),
      },
      {
        $set: {
          [`months.${monthKey}.paid`]: true,
          [`months.${monthKey}.paidAt`]: new Date(),
          [`months.${monthKey}.value`]: charge.transactionAmount,
        },
      }
    );
  }

  console.log("OUT - updateCharge");
};

function getMonthKeyFromDate(date: string) {
  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  return months[new Date(date).getMonth()];
}
