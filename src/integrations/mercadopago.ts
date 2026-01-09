import { ICreateChargeMPagoRequest } from "../types/charges";
import { randomUUID } from "crypto";
import axios from "axios";

export const createMercadoPagoClient = async () => {
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
