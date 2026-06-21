import { ChargeModel } from "../../models/Charge";
import { ContributionModel } from "../../models/Contribution";
import { createMercadoPagoClient } from "../../integrations/mercadopago";
import { executeMongoTransaction } from "../../utils/mongoose";
import { IChargeDTO, IConsultChargeMPagoResponse, IMercadoPagoWebhookPayload } from "../../types/charges";

export const processMercadoPagoWebhook = async (
  payload: IMercadoPagoWebhookPayload,
): Promise<void> => {
  console.log("IN - processMercadoPagoWebhook", { action: payload.action, type: payload.type });

  if (payload.type !== "payment") {
    console.log("Skipping non-payment webhook type:", payload.type);
    return;
  }

  const paymentId = payload.data.id;
  const mpClient = await createMercadoPagoClient();
  const paymentData: IConsultChargeMPagoResponse = await mpClient.consultPayment(paymentId);

  const charge = await ChargeModel.findOne({ transactionId: Number(paymentId) });

  if (!charge) {
    console.log("Charge not found for transactionId:", paymentId);
    return;
  }

  if (charge.status === paymentData.status) {
    console.log("Status unchanged, skipping update:", paymentData.status);
    return;
  }

  await updateCharge(charge, paymentData);

  console.log("OUT - processMercadoPagoWebhook");
};

const updateCharge = async (
  charge: IChargeDTO,
  chargeConsulted: IConsultChargeMPagoResponse,
) => {
  console.log("IN - updateCharge", { transactionId: charge.transactionId, newStatus: chargeConsulted.status });

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

function getMonthKeyFromDate(month: number): string {
  const months = [
    "january", "february", "march", "april",
    "may", "june", "july", "august",
    "september", "october", "november", "december",
  ];
  return months[month];
}
