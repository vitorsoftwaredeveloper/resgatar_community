import { db } from "../../db";
import { MemberModel } from "../../models/Member";
import { sendPushNotificationToTokens } from "../../integrations/firebase";
import { clearInvalidPushTokens } from "../notifications/pushTokens";
import { INTERNAL_ROLES } from "../../constants/members";

export const execute = async () => {
  console.log("IN - birthdayNotification");

  try {
    await db();

    const now = new Date();
    const todayMonth = now.getMonth() + 1;
    const todayDay = now.getDate();

    const allMembers = await MemberModel.find(
      { role: { $in: INTERNAL_ROLES }, dateOfBirth: { $ne: null } },
      { firstName: 1, lastName: 1, dateOfBirth: 1, pushTokens: 1 },
      { lean: true },
    );

    const birthdayMembers = allMembers.filter((m) => {
      if (!m.dateOfBirth) return false;
      const dob = new Date(Number(m.dateOfBirth));
      return dob.getMonth() + 1 === todayMonth && dob.getDate() === todayDay;
    });

    console.log(`Birthday members today: ${birthdayMembers.length}`);

    if (birthdayMembers.length === 0) return;

    const birthdayIds = new Set(birthdayMembers.map((m) => String(m._id)));

    const names = birthdayMembers
      .map((m) => `${m.firstName} ${m.lastName}`)
      .join(", ");

    const communityTokens = allMembers
      .filter((m) => !birthdayIds.has(String(m._id)))
      .flatMap((m) => m.pushTokens ?? []);

    const birthdayTokens = birthdayMembers.flatMap((m) => m.pushTokens ?? []);

    const communityBody =
      birthdayMembers.length === 1
        ? `Hoje é aniversário de ${names}! Deseje um feliz aniversário!`
        : `Hoje é aniversário de ${names}! Deseje um feliz aniversário a eles!`;

    const allInvalidTokens: string[] = [];

    if (communityTokens.length > 0) {
      const invalid = await sendPushNotificationToTokens(
        communityTokens,
        "🎂 Aniversariantes do dia",
        communityBody,
      );
      allInvalidTokens.push(...invalid);
    }

    if (birthdayTokens.length > 0) {
      const invalid = await sendPushNotificationToTokens(
        birthdayTokens,
        "🎉 Feliz Aniversário!",
        "A comunidade Resgatar deseja a você um feliz aniversário! Que Deus te abençoe!",
      );
      allInvalidTokens.push(...invalid);
    }

    await clearInvalidPushTokens(allInvalidTokens);
  } catch (error) {
    console.error("Error sending birthday notification:", error);
  } finally {
    console.log("OUT - birthdayNotification");
  }
};
