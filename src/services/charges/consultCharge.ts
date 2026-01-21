import { ChargeModel } from "../../models/Charge";
import { createMercadoPagoClient } from "../../integrations/mercadopago";
import { STATUS_CODE } from "../../constants";
import { findMemberById } from "../helper";
import { TRANSACTION_STATUS } from "../../constants/charges";
import { IChargeDTO, IConsultChargeMPagoResponse } from "../../types/charges";
import { ContributionModel } from "../../models/Contribution";
import { executeMongoTransaction } from "../../utils/mongoose";

export const consultChargeService = async (
  memberId: string,
  transactionId: string,
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

      if (charge.status !== response.status) {
        await updateCharge(charge, response);
      }
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
  chargeConsulted: IConsultChargeMPagoResponse,
) => {
  console.log("IN - updateCharge");
  await executeMongoTransaction(async () => {
    await ChargeModel.updateOne(
      { transactionId: charge.transactionId },
      {
        $set: {
          status: chargeConsulted.status,
          statusDetail: chargeConsulted.status_detail,
          dateApproved: chargeConsulted.date_approved,
        },
      },
    );

    const monthKey = getMonthKeyFromDate(charge.referenceMonth);

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
      },
    );
  });

  console.log("OUT - updateCharge");
};

function getMonthKeyFromDate(month: number) {
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

  return months[month];
}
