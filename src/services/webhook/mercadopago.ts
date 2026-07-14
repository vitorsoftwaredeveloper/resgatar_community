import { ChargeModel } from "../../models/Charge";
import { ContributionModel } from "../../models/Contribution";
import { DonationModel } from "../../models/Donation";
import { MemberModel } from "../../models/Member";
import { createMercadoPagoClient } from "../../integrations/mercadopago";
import { DONATION_EXTERNAL_REFERENCE } from "../donations/createDonationPix";
import { notifyPaymentConfirmed } from "../notifications/notifyPaymentConfirmed";
import { executeMongoTransaction } from "../../utils/mongoose";
import {
  IChargeDTO,
  IConsultChargeMPagoResponse,
  IMercadoPagoWebhookPayload,
} from "../../types/charges";
import {
  CONTRIBUTION_PAYMENT_METHOD,
  MONTH_KEYS,
  TRANSACTION_STATUS,
  isReturnedTransaction,
} from "../../constants/charges";

export const processMercadoPagoWebhook = async (
  payload: IMercadoPagoWebhookPayload,
): Promise<void> => {
  console.log("IN - processMercadoPagoWebhook");

  if (payload.type !== "payment") {
    console.log("Skipping non-payment webhook type:", payload.type);
    return;
  }

  const paymentId = payload.data.id;
  const mpClient = await createMercadoPagoClient();
  const paymentData: IConsultChargeMPagoResponse =
    await mpClient.consultPayment(paymentId);

  console.log({ consultResponse: paymentData });

  // Doação e contribuição (charge) compartilham o mesmo webhook. A tag
  // external_reference, gravada na criação do pagamento, decide o fluxo.
  // Charges não têm essa tag -> caem no fluxo de charge (retrocompatível).
  if (paymentData.external_reference === DONATION_EXTERNAL_REFERENCE) {
    await processDonationApproval(paymentId, paymentData);
    console.log("OUT - processMercadoPagoWebhook (donation)");
    return;
  }

  const charge = await ChargeModel.findOne(
    {
      transactionId: Number(paymentId),
    },
    {},
    { lean: true },
  );

  if (!charge) {
    console.log("Charge not found for transactionId:", paymentId);
    return;
  }

  if (charge.status === paymentData.status) {
    console.log("Status unchanged, skipping update:", paymentData.status);
    return;
  }

  await updateCharge(charge, paymentData);

  if (paymentData.status === TRANSACTION_STATUS.APPROVED) {
    await notifyMember(charge.memberId, charge.transactionId);
  }

  console.log("OUT - processMercadoPagoWebhook");
};

const updateCharge = async (
  charge: IChargeDTO,
  chargeConsulted: IConsultChargeMPagoResponse,
) => {
  console.log("IN - updateCharge", {
    transactionId: charge.transactionId,
    newStatus: chargeConsulted.status,
  });

  // Once a charge leaves PENDING the payment artifacts (QR image, copy-paste
  // code, ticket URL) are dead weight - nobody scans the QR of a settled
  // charge. Dropping them here keeps the heaviest field (qrCodeBase64) from
  // accumulating in the free-tier database.
  const status = chargeConsulted.status;
  const isTerminal = status !== TRANSACTION_STATUS.PENDING;

  await executeMongoTransaction(async () => {
    await ChargeModel.updateOne(
      { transactionId: charge.transactionId },
      {
        $set: {
          status,
          statusDetail: chargeConsulted.status_detail,
          dateApproved: chargeConsulted.date_approved,
        },
        ...(isTerminal && {
          $unset: {
            "transactionData.qrCodeBase64": "",
            "transactionData.qrCode": "",
            "transactionData.ticketUrl": "",
          },
        }),
      },
    );

    // A grade de Contribution é a fonte da verdade das agregações (resumo
    // mensal/anual, meta, balanço). O mês só fica "pago" enquanto a charge
    // está aprovada:
    //  - aprovado  -> marca o mês como pago, com valor/método/data.
    //  - devolvido  (refunded/charged_back) -> reverte o mês para não pago e
    //    limpa os campos do pagamento, para o dinheiro estornado parar de
    //    contar como arrecadação.
    //  - demais status (rejected/cancelled/pending) nunca representam um
    //    pagamento liquidado, então não mexem na grade.
    const contributionFilter = {
      memberId: charge.memberId,
      year: new Date(charge.dateCreated).getFullYear(),
    };
    const monthKey = getMonthKeyFromDate(charge.referenceMonth);

    if (status === TRANSACTION_STATUS.APPROVED) {
      await ContributionModel.updateOne(contributionFilter, {
        $set: {
          [`months.${monthKey}.paid`]: true,
          [`months.${monthKey}.paidAt`]: new Date(),
          [`months.${monthKey}.value`]: charge.transactionAmount,
          [`months.${monthKey}.paymentMethod`]:
            CONTRIBUTION_PAYMENT_METHOD.PIX,
        },
      });
    } else if (isReturnedTransaction(status)) {
      await ContributionModel.updateOne(contributionFilter, {
        $set: { [`months.${monthKey}.paid`]: false },
        $unset: {
          [`months.${monthKey}.paidAt`]: "",
          [`months.${monthKey}.value`]: "",
          [`months.${monthKey}.paymentMethod`]: "",
        },
      });
    }
  });

  console.log("OUT - updateCharge");
};

const notifyMember = async (
  memberId: string,
  transactionId: string | number,
): Promise<void> => {
  console.log("IN - notifyMember", { memberId });

  const member = await MemberModel.findById(memberId, {}, { lean: true });

  await notifyPaymentConfirmed(
    member?.pushToken,
    CONTRIBUTION_PAYMENT_METHOD.PIX,
    transactionId,
  );

  console.log("OUT - notifyMember");
};

// Doação: store-and-forward simples (não toca em Contribution). Atualiza o
// status, descarta os artefatos de PIX quando termina (mesmo motivo das charges:
// o qrCodeBase64 é pesado) e notifica quem registrou.
const processDonationApproval = async (
  paymentId: string,
  paymentData: IConsultChargeMPagoResponse,
): Promise<void> => {
  console.log("IN - processDonationApproval", { paymentId });

  const donation = await DonationModel.findOne(
    { transactionId: paymentId },
    {},
    { lean: true },
  );

  if (!donation) {
    console.log("Donation not found for transactionId:", paymentId);
    return;
  }

  // Doação devolvida (refunded/charged_back) não é caixa e não é histórico útil:
  // o dinheiro voltou para o doador. Ao contrário da charge — que precisa
  // sobreviver para reverter o mês na grade de Contribution — a doação é um
  // ledger isolado, então o registro é apagado em vez de virar uma linha morta
  // que o front teria que filtrar. Vem antes da checagem de status inalterado
  // para que um webhook repetido também limpe registros devolvidos legados.
  if (isReturnedTransaction(paymentData.status)) {
    await DonationModel.deleteOne({ transactionId: paymentId });
    console.log("Deleted returned donation:", {
      paymentId,
      status: paymentData.status,
    });
    console.log("OUT - processDonationApproval");
    return;
  }

  if (donation.status === paymentData.status) {
    console.log("Status unchanged, skipping update:", paymentData.status);
    return;
  }

  const isTerminal = paymentData.status !== TRANSACTION_STATUS.PENDING;

  await DonationModel.updateOne(
    { transactionId: paymentId },
    {
      $set: {
        status: paymentData.status,
        statusDetail: paymentData.status_detail,
        dateApproved: paymentData.date_approved,
      },
      ...(isTerminal && {
        $unset: {
          "transactionData.qrCodeBase64": "",
          "transactionData.qrCode": "",
          "transactionData.ticketUrl": "",
        },
      }),
    },
  );

  if (paymentData.status === TRANSACTION_STATUS.APPROVED) {
    const member = await MemberModel.findById(
      donation.memberId,
      {},
      { lean: true },
    );
    await notifyPaymentConfirmed(
      member?.pushToken,
      CONTRIBUTION_PAYMENT_METHOD.PIX,
      paymentId,
    );
  }

  console.log("OUT - processDonationApproval");
};

function getMonthKeyFromDate(month: number): string {
  return MONTH_KEYS[month];
}
