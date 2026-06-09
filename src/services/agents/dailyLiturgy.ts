import { sendPushNotificationToAll } from "../../integrations/firebase";

export const execute = async () => {
  console.log("IN - dailyLiturgy");

  try {
    await sendPushNotificationToAll(
      "Liturgia Diária",
      "A Palavra de Deus para hoje está esperando por você.",
    );

    console.log("Daily liturgy notification sent successfully");
  } catch (error) {
    console.error("Error sending daily liturgy notification:", error);
  } finally {
    console.log("OUT - dailyLiturgy");
  }
};
