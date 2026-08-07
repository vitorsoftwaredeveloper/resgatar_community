import { sendPushNotificationToTokens } from "../../integrations/firebase";
import { clearInvalidPushTokens } from "./pushTokens";

const PAYMENT_CONFIRMED_NOTIFICATION_TYPE = "PAYMENT_CONFIRMED";

export const notifyPaymentConfirmed = async (
  pushTokens?: string[] | null,
  paymentMethod?: string,
  transactionId?: string | number,
): Promise<void> => {
  console.log("IN - notifyPaymentConfirmed");

  if (!pushTokens || pushTokens.length === 0) {
    console.log("No pushTokens found, skipping payment notification");
    return;
  }

  const invalidTokens = await sendPushNotificationToTokens(
    pushTokens,
    "Pagamento confirmado!",
    "Seu pagamento foi processado com sucesso.",
    {
      type: PAYMENT_CONFIRMED_NOTIFICATION_TYPE,
      ...(paymentMethod && { paymentMethod }),
      ...(transactionId != null && { transactionId: String(transactionId) }),
    },
  );

  await clearInvalidPushTokens(invalidTokens);

  console.log("OUT - notifyPaymentConfirmed");
};
