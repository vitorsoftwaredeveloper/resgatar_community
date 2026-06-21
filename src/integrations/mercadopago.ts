import { ICreateChargeMPagoRequest } from "../types/charges";
import { randomUUID, createHmac, timingSafeEqual } from "crypto";
import axios from "axios";

// Validates the x-signature header sent by Mercado Pago on every webhook call.
// See: https://www.mercadopago.com.br/developers/en/docs/your-integrations/notifications/webhooks
export const validateWebhookSignature = (
  xSignature: string,
  xRequestId: string,
  dataId: string,
): boolean => {
  const secret = process.env.MPAGO_WEBHOOK_SECRET as string;
  if (!secret) return false;

  // x-signature format: "ts=<timestamp>,v1=<hmac-sha256>"
  const parts = xSignature.split(",");
  const tsPart = parts.find((p) => p.startsWith("ts="));
  const v1Part = parts.find((p) => p.startsWith("v1="));

  if (!tsPart || !v1Part) return false;

  const ts = tsPart.split("=")[1];
  const receivedHash = v1Part.split("=")[1];

  const signedMessage = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expectedHash = createHmac("sha256", secret).update(signedMessage).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expectedHash, "hex"), Buffer.from(receivedHash, "hex"));
  } catch {
    return false;
  }
};

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
