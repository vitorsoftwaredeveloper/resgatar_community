import { MercadoPagoConfig, Payment } from "mercadopago";
import { PaymentGetData } from "mercadopago/dist/clients/payment/get/types";
import {
  ICreateChargeMPagoRequest,
  ICreateChargeMPagoResponse,
} from "../types/charges";
import { randomUUID } from "crypto";
import axios from "axios";

export const createMercadoPagoClient = async () => {
  const MP = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
  });

  const mercadoPagoClient = new Payment(MP);

  return {
    createPayment: async (chargeData: ICreateChargeMPagoRequest) => {
      return await axios
        .post(process.env.MPAGO_TRANSACTION_URL as string, chargeData, {
          headers: {
            Authorization: `Bearer ${process.env.MPAGO_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            "X-Idempotency-Key": randomUUID(),
          },
        })
        .then((response) => {
          console.log(response.data);
          return response.data;
        })
        .catch((error) => {
          console.error(error);
          throw error;
        });
    },
    consultPayment: async (transactionId: string) => {
      return await axios
        .get(`${process.env.MPAGO_TRANSACTION_URL}/${transactionId}`, {
          headers: {
            Authorization: `Bearer ${process.env.MPAGO_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            "X-Idempotency-Key": randomUUID(),
          },
        })
        .then((response) => {
          console.log(response.data);
          return response.data;
        })
        .catch((error) => {
          console.error(error);
          throw error;
        });
    },
  };
};
