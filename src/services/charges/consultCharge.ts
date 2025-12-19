import { ChargeModel } from "../../models/Charge";
import { createMercadoPagoClient } from "../../integrations/mercadopago";
import { STATUS_CODE } from "../../constants";
import { findMemberById } from "../members/helper";
import { TRANSACTION_STATUS } from "../../constants/charges";
import { IChargeDTO, IConsultChargeMPagoResponse } from "../../types/charges";

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
  }

  console.log("OUT - updateCharge");
};
