import { MercadoPagoConfig, Payment } from "mercadopago";
import { PaymentGetData } from "mercadopago/dist/clients/payment/get/types";
import {
  ICreateChargeMPagoRequest,
  ICreateChargeMPagoResponse,
} from "../types/charges";
import { randomUUID } from "crypto";

export const createMercadoPagoClient = async () => {
  const MP = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
  });

  const mercadoPagoClient = new Payment(MP);

  return {
    createPayment: async (
      chargeData: ICreateChargeMPagoRequest
    ): Promise<ICreateChargeMPagoResponse> => {
      console.log("IN - createPayment - MercadoPago");

      const response = await mercadoPagoClient
        .create({
          body: chargeData,
          requestOptions: {
            idempotencyKey: randomUUID(),
          },
        })
        .catch((error) => {
          console.error("Error creating payment in MercadoPago:", error);
          throw error;
        });

      console.log("Charge created in MercadoPago:", response);

      const formattedResponse: ICreateChargeMPagoResponse = {
        id: response.id!,
        date_created: response.date_created!,
        date_of_expiration: response.date_of_expiration,
        status: response.status as ICreateChargeMPagoResponse["status"],
        status_detail:
          response.status_detail as ICreateChargeMPagoResponse["status_detail"],
        transaction_amount: response.transaction_amount!,
        currency_id: response.currency_id as "BRL",
        payment_method_id: "pix",
        payer: {
          email: response.payer?.email!,
        },
        point_of_interaction: {
          type: "PIX",
          transaction_data: {
            qr_code: response.point_of_interaction!.transaction_data!.qr_code!,
            qr_code_base64:
              response.point_of_interaction!.transaction_data!.qr_code_base64!,
            ticket_url:
              response.point_of_interaction!.transaction_data!.ticket_url!,
          },
        },
        metadata: response.metadata,
        notification_url: response.notification_url,
      };

      console.log("OUT - createPayment - MercadoPago");
      return formattedResponse;
    },
    consultPayment: async (payment: PaymentGetData) => {
      const response = await mercadoPagoClient.get(payment);
      return response;
    },
  };
};
