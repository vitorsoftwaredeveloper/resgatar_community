import { MemberModel } from "../../models/Member";
import { IMember } from "../../types/members";

export const listBirthdayMembersService = async (): Promise<
  Array<Partial<IMember>>
> => {
  console.log("IN - listBirthdayMembersService");

  const currentMonth = new Date().getMonth() + 1;

  const allMembers = await MemberModel.find(
    { dateOfBirth: { $ne: null } },
    { firstName: 1, lastName: 1, dateOfBirth: 1, profileImage: 1 },
    { lean: true },
  );

  const birthdayMembers = allMembers.filter((m) => {
    if (!m.dateOfBirth) return false;
    const dob = new Date(Number(m.dateOfBirth));
    return dob.getMonth() + 1 === currentMonth;
  });

  console.log(
    `Birthday members this month (${currentMonth}): ${birthdayMembers.length}`,
  );

  birthdayMembers.sort((a, b) => {
    const dayA = new Date(Number(a.dateOfBirth)).getDate();
    const dayB = new Date(Number(b.dateOfBirth)).getDate();
    return dayA - dayB;
  });

  console.log("OUT - listBirthdayMembersService");

  return birthdayMembers as Array<Partial<IMember>>;
};
