import { MercadoPagoConfig, Payment } from "mercadopago";
import { PaymentResponse } from "mercadopago/dist/clients/payment/commonTypes";
import { PaymentGetData } from "mercadopago/dist/clients/payment/get/types";
import { ICreateChargeMPago } from "../types/charges";
import { randomUUID } from "crypto";

export const createMercadoPagoClient = async () => {
  const MP = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
  });

  const mercadoPagoClient = new Payment(MP);

  return {
    createPayment: async (
      chargeData: ICreateChargeMPago
    ): Promise<PaymentResponse> => {
      console.log("IN - createPayment - MercadoPago");

      const response = await mercadoPagoClient.create({
        body: chargeData,
        requestOptions: {
          idempotencyKey: randomUUID(),
        },
      });

      console.log("OUT - createPayment - MercadoPago");
      return response;
    },
    consultPayment: async (payment: PaymentGetData) => {
      const response = await mercadoPagoClient.get(payment);
      return response;
    },
  };
};
