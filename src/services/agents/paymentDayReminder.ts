import { db } from "../../db";
import { MemberModel } from "../../models/Member";
import { sendNotification } from "../notifications/sendNotification";
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
      },
      { _id: 1 },
      { lean: true },
    );

    console.log(
      `Members with payment due today (day ${today}):`,
      members.length,
    );

    if (members.length === 0) return;

    await sendNotification(
      members.map((member) => String(member._id)),
      {
        title: "Lembrete de Pagamento",
        body: "Hoje é o seu dia de contribuição, contamos com sua generosidade!",
        link: "/bills",
      },
    );
  } catch (error) {
    console.error("Error sending payment day reminder:", error);
  } finally {
    console.log("OUT - paymentDayReminder");
  }
};
