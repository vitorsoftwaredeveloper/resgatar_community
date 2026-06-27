import { DonationModel } from "../../models/Donation";
import {
  ICreateDonationPixPayload,
  IDonationDTO,
} from "../../types/donations";
import {
  ICreateChargeMPagoRequest,
  ICreateChargeMPagoResponse,
} from "../../types/charges";
import { createMercadoPagoClient } from "../../integrations/mercadopago";
import { PAYMENT_METHOD_ID } from "../../constants/charges";
import { IMember } from "../../types/members";
import { findMemberById } from "../helper";
import { decrypt } from "../../utils/crypto";

// Tag no pagamento MP que o webhook usa para rotear doação vs charge.
export const DONATION_EXTERNAL_REFERENCE = "donation";

export const createDonationPixService = async (
  memberId: string,
  payload: ICreateDonationPixPayload,
): Promise<IDonationDTO> => {
  console.log("IN - createDonationPixService");

  // O pagador é o membro logado (mesmo que a doação seja em nome de outra
  // pessoa via donorName). Reusa os dados dele no payer do MP.
  const member: IMember = await findMemberById(memberId);

  try {
    const request = formatDonationRequest(member, payload.amount);

    const mpClient = await createMercadoPagoClient();
    const response: ICreateChargeMPagoResponse =
      await mpClient.createPayment(request);

    const donationDTO = formatDonationDTO(member, payload, response);

    await DonationModel.insertOne(donationDTO);

    return donationDTO;
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - createDonationPixService");
  }
};

const formatDonationRequest = (
  member: IMember,
  amount: string,
): ICreateChargeMPagoRequest => ({
  transaction_amount: Number(amount.replace(",", ".")),
  payment_method_id: PAYMENT_METHOD_ID.PIX,
  description: "Donation to Resgatar Community",
  notification_url: `${process.env.MPAGO_NOTIFICATION_URL}/webhook/mercadopago`,
  external_reference: DONATION_EXTERNAL_REFERENCE,
  payer: {
    identification: {
      number: decrypt(member.identification.numberType),
      type: member.identification.type,
    },
    last_name: member.lastName,
    first_name: member.firstName,
    email: member.email,
  },
});

const formatDonationDTO = (
  member: IMember,
  payload: ICreateDonationPixPayload,
  data: ICreateChargeMPagoResponse,
): IDonationDTO => {
  const now = new Date();

  return {
    transactionId: String(data.id),
    memberId: member._id,
    donorName: payload.donorName?.trim() || undefined,
    amount: payload.amount,
    paymentMethodId: "pix",
    status: data.status,
    statusDetail: data.status_detail,
    currencyId: data.currency_id,
    dateCreated: data.date_created,
    dateOfExpiration: data.date_of_expiration,
    referenceMonth: now.getMonth(), // 0-indexado
    referenceYear: now.getFullYear(),
    transactionData: {
      qrCode: data.point_of_interaction.transaction_data.qr_code,
      qrCodeBase64: data.point_of_interaction.transaction_data.qr_code_base64,
      ticketUrl: data.point_of_interaction.transaction_data.ticket_url,
    },
  };
};
