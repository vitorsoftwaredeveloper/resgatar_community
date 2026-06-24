import { sendPushNotificationToTokens } from "../../integrations/firebase";

const PAYMENT_CONFIRMED_NOTIFICATION_TYPE = "PAYMENT_CONFIRMED";

export const notifyPaymentConfirmed = async (
  pushToken?: string | null,
  paymentMethod?: string,
): Promise<void> => {
  console.log("IN - notifyPaymentConfirmed");

  if (!pushToken) {
    console.log("No pushToken found, skipping payment notification");
    return;
  }

  await sendPushNotificationToTokens(
    [pushToken],
    "Pagamento confirmado!",
    "Seu pagamento foi processado com sucesso.",
    {
      type: PAYMENT_CONFIRMED_NOTIFICATION_TYPE,
      ...(paymentMethod && { paymentMethod }),
    },
  );

  console.log("OUT - notifyPaymentConfirmed");
};
