import { ChargeModel } from "../../models/Charge";
import {
  ICreateChargePayload,
  ICreateChargeMPagoRequest,
  ICreateChargeMPagoResponse,
} from "../../types/charges";
import { createMercadoPagoClient } from "../../integrations/mercadopago";
import {
  CURRENCY_ID,
  PAYMENT_METHOD_ID,
  PAYMENT_TYPE_ID,
} from "../../constants/charges";
import { MemberModel } from "../../models/Member";
import { IMember } from "../../types/members";
import { create } from "domain";

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

const findMemberById = async (memberId: string) => {
  console.log("IN - formatCharge");

  try {
    return await MemberModel.findById(memberId);
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - formatCharge");
  }
};

const formatCharge = (
  member: IMember,
  payload: ICreateChargePayload
): ICreateChargeMPagoRequest => {
  console.log("IN - formatCharge");

  const charge = {
    transaction_amount: payload.transactionAmount,
    payment_method_id: PAYMENT_METHOD_ID.PIX as "pix",
    description: payload.description,
    payer: {
      email: member.email,
    },
  };

  console.log("Charge formatted:", { charge });

  console.log("OUT - formatCharge");
  return charge;
};

const formatChargeDTO = (
  member: IMember,
  chargeData: ICreateChargeMPagoResponse
): any => {
  console.log("IN - formatChargeDTO");

  const chargeDTO = {
    _id: chargeData.id,
    status: chargeData.status,
    statusDetail: chargeData.status_detail,
    transactionAmount: chargeData.transaction_amount,
    paymentMethodId: chargeData.payment_method_id,
    currencyId: chargeData.currency_id,
    dateCreated: chargeData.date_created,
    dateOfExpiration: chargeData.date_of_expiration,
    dateApproved: new Date().toISOString(),
    transactionDetails: {
      netReceivedAmount: chargeData.transaction_amount,
    },
    payer: {
      memberId: member._id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      identification: {
        type: member.identification.type,
        number: member.identification.number,
      },
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
