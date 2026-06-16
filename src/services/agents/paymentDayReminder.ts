import { db } from "../../db";
import { MemberModel } from "../../models/Member";
import { sendPushNotificationToTokens } from "../../integrations/firebase";

export const execute = async () => {
  console.log("IN - paymentDayReminder");

  try {
    await db();

    const today = new Date().getDate();

    const members = await MemberModel.find(
      {
        "paymentInfo.datePayment": today,
        pushToken: { $ne: null },
      },
      { pushToken: 1, firstName: 1 },
      { lean: true },
    );

    console.log(
      `Members with payment due today (day ${today}):`,
      members.length,
    );

    if (members.length === 0) return;

    const tokens = members.map((m) => m.pushToken as string);

    const invalidTokens = await sendPushNotificationToTokens(
      tokens,
      "Lembrete de Pagamento",
      "Hoje é o seu dia de contribuição, contamos com sua generosidade!",
    );

    if (invalidTokens.length > 0) {
      await MemberModel.updateMany(
        { pushToken: { $in: invalidTokens } },
        { $set: { pushToken: null } },
      );
      console.log("Cleared invalid push tokens:", invalidTokens.length);
    }
  } catch (error) {
    console.error("Error sending payment day reminder:", error);
  } finally {
    console.log("OUT - paymentDayReminder");
  }
};
