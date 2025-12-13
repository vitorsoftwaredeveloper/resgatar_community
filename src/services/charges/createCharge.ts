import { ChargeModel } from "../../models/Charge";
import { ICreateChargePayload, ICreateChargeMPago } from "../../types/charges";
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
    const chargeData: any = formatCharge(member, payload);

    const mpClient = await createMercadoPagoClient();

    const response = await mpClient.createPayment(chargeData);

    console.log("Charge created in MercadoPago:", response);

    return response;
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
): ICreateChargeMPago => {
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
