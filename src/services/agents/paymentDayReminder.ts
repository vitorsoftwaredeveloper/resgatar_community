import { db } from "../../db";
import { MemberModel } from "../../models/Member";
import { sendPushNotificationToTokens } from "../../integrations/firebase";
import { clearInvalidPushTokens } from "../notifications/pushTokens";
import { INTERNAL_ROLES } from "../../constants/members";

export const execute = async () => {
  console.log("IN - paymentDayReminder");

  try {
    await db();

    const today = new Date().getDate();

    const members = await MemberModel.find(
      {
        role: { $in: INTERNAL_ROLES },
        "paymentInfo.datePayment": today,
        "pushTokens.0": { $exists: true },
      },
      { pushTokens: 1, firstName: 1 },
      { lean: true },
    );

    console.log(
      `Members with payment due today (day ${today}):`,
      members.length,
    );

    if (members.length === 0) return;

    const tokens = members.flatMap((m) => m.pushTokens ?? []);

    const invalidTokens = await sendPushNotificationToTokens(
      tokens,
      "Lembrete de Pagamento",
      "Hoje é o seu dia de contribuição, contamos com sua generosidade!",
    );

    await clearInvalidPushTokens(invalidTokens);
  } catch (error) {
    console.error("Error sending payment day reminder:", error);
  } finally {
    console.log("OUT - paymentDayReminder");
  }
};
