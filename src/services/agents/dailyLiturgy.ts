import { db } from "../../db";
import { sendNotificationToAllMembers } from "../notifications/sendNotification";

export const execute = async () => {
  console.log("IN - dailyLiturgy");

  try {
    await db();

    await sendNotificationToAllMembers({
      title: "Liturgia Diária",
      body: "A Palavra de Deus para hoje está esperando por você.",
      link: "/readings",
    });

    console.log("Daily liturgy notification sent successfully");
  } catch (error) {
    console.error("Error sending daily liturgy notification:", error);
  } finally {
    console.log("OUT - dailyLiturgy");
  }
};
