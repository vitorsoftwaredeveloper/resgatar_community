import { ChargeModel } from "../../models/Charge";
import {
  ICreateChargePayload,
  ICreateChargeMPagoResponse,
  IChargeDTO,
} from "../../types/charges";
import { createMercadoPagoClient } from "../../integrations/mercadopago";
import { PAYMENT_METHOD_ID } from "../../constants/charges";
import { MemberModel } from "../../models/Member";
import { IMember } from "../../types/members";
import { findMemberById } from "../helper";

export const createChargeService = async (
  memberId: string,
  payload: ICreateChargePayload
): Promise<any> => {
  console.log("IN - createChargeService");

  const member: IMember = await findMemberById(memberId);

  console.log("Member found:", member);

  try {
    const chargeRequest: any = formatCharge(member, payload);

    const mpClient = await createMercadoPagoClient();

    const response = await mpClient.createPayment(chargeRequest);

    const chargeDTO = formatChargeDTO(member, response);

    await saveCharge(chargeDTO);

    return chargeDTO;
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - createChargeService");
  }
};

const formatCharge = (member: IMember, payload: ICreateChargePayload): any => {
  console.log("IN - formatCharge");

  const charge = {
    transaction_amount: payload.transactionAmount,
    payment_method_id: PAYMENT_METHOD_ID.PIX as "pix",
    description: "Contribution to Resgatar Community",
    payer: {
      identification: {
        number: member.identification.numberType.replace(/\D/g, ""),
        type: member.identification.type,
      },
      last_name: member.lastName,
      first_name: member.firstName,
      email: member.email,
    },
  };

  console.log("OUT - formatCharge");
  return charge;
};

const formatChargeDTO = (
  member: IMember,
  chargeData: ICreateChargeMPagoResponse
): IChargeDTO => {
  console.log("IN - formatChargeDTO");

  const chargeDTO = {
    transactionId: chargeData.id,
    memberId: member._id,
    status: chargeData.status,
    statusDetail: chargeData.status_detail,
    transactionAmount: Number(chargeData.transaction_amount.toFixed(2)),
    paymentMethodId: chargeData.payment_method_id,
    currencyId: chargeData.currency_id,
    dateCreated: chargeData.date_created,
    dateOfExpiration: chargeData.date_of_expiration,
    paymentTypeId: chargeData.payment_type_id,
    payer: {
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      identification: {
        numberType: member.identification.numberType,
        type: member.identification.type,
      },
    },
    transactionData: {
      qrCode: chargeData.point_of_interaction.transaction_data.qr_code,
      qrCodeBase64:
        chargeData.point_of_interaction.transaction_data.qr_code_base64,
      ticketUrl: chargeData.point_of_interaction.transaction_data.ticket_url,
    },
  };

  console.log("Charge DTO formatted:", { chargeDTO });

  console.log("OUT - formatChargeDTO");
  return chargeDTO;
};

const saveCharge = async (chargeDTO: any) => {
  console.log("IN - saveCharge");

  try {
    await ChargeModel.insertOne(chargeDTO);
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - saveCharge");
  }
};
