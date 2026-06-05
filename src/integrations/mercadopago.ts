import { ICreateChargeMPagoRequest } from "../types/charges";
import { randomUUID } from "crypto";
import axios from "axios";

export const createMercadoPagoClient = async () => {
  return {
    createPayment: async (chargeData: ICreateChargeMPagoRequest) => {
      console.log("IN - createPayment - MPago");
      return await axios
        .post(process.env.MPAGO_TRANSACTION_URL as string, chargeData, {
          headers: {
            Authorization: `Bearer ${process.env.MPAGO_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            "X-Idempotency-Key": randomUUID(),
          },
        })
        .then((response) => {
          console.log("OUT - createPayment - MPago - transactionId:", response.data?.id);
          return response.data;
        })
        .catch((error) => {
          console.error("ERR - createPayment - MPago - status:", error?.response?.status);
          throw error;
        });
    },
    consultPayment: async (transactionId: string) => {
      console.log("IN - consultPayment - MPago");
      return await axios
        .get(`${process.env.MPAGO_TRANSACTION_URL}/${transactionId}`, {
          headers: {
            Authorization: `Bearer ${process.env.MPAGO_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            "X-Idempotency-Key": randomUUID(),
          },
        })
        .then((response) => {
          console.log("OUT - consultPayment - MPago - transactionId:", transactionId, "status:", response.data?.status);
          return response.data;
        })
        .catch((error) => {
          console.error("ERR - consultPayment - MPago - status:", error?.response?.status);
          throw error;
        });
    },
  };
};
