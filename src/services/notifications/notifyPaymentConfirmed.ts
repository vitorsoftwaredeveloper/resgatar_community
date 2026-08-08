import { sendNotification } from "./sendNotification";

const PAYMENT_CONFIRMED_NOTIFICATION_TYPE = "PAYMENT_CONFIRMED";

export const notifyPaymentConfirmed = async (
  memberId?: string | null,
  paymentMethod?: string,
  transactionId?: string | number,
): Promise<void> => {
  console.log("IN - notifyPaymentConfirmed");

  if (!memberId) {
    console.log("No memberId found, skipping payment notification");
    return;
  }

  await sendNotification([memberId], {
    title: "Pagamento confirmado!",
    body: "Seu pagamento foi processado com sucesso.",
    data: {
      type: PAYMENT_CONFIRMED_NOTIFICATION_TYPE,
      ...(paymentMethod && { paymentMethod }),
      ...(transactionId != null && { transactionId: String(transactionId) }),
    },
  });

  console.log("OUT - notifyPaymentConfirmed");
};
