import { db } from "../../db";
import { MemberModel } from "../../models/Member";
import { sendNotification } from "../notifications/sendNotification";
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
      { firstName: 1, lastName: 1, dateOfBirth: 1 },
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

    const communityIds = allMembers
      .filter((m) => !birthdayIds.has(String(m._id)))
      .map((m) => String(m._id));

    const communityBody =
      birthdayMembers.length === 1
        ? `Hoje é aniversário de ${names}! Deseje um feliz aniversário!`
        : `Hoje é aniversário de ${names}! Deseje um feliz aniversário a eles!`;

    if (communityIds.length > 0) {
      await sendNotification(communityIds, {
        title: "🎂 Aniversariantes do dia",
        body: communityBody,
      });
    }

    await sendNotification([...birthdayIds], {
      title: "🎉 Feliz Aniversário!",
      body: "A comunidade Resgatar deseja a você um feliz aniversário! Que Deus te abençoe!",
    });
  } catch (error) {
    console.error("Error sending birthday notification:", error);
  } finally {
    console.log("OUT - birthdayNotification");
  }
};
