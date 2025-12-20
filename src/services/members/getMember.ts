import { ContributionModel } from "../../models/Contribution";
import { IMember } from "../../types/members";
import { findMemberById } from "./helper";

export const getMemberService = async (
  memberId: string
): Promise<
  IMember & {
    contributions: Array<{ year: number; months: Record<string, boolean> }>;
  }
> => {
  console.log("IN - getMembersService");

  const member = await findMemberById(memberId, {
    _id: 0,
    email: 1,
    phoneNumber: 1,
    role: 1,
    paymentInfo: 1,
    identification: 1,
    status: 1,
    firstName: 1,
    lastName: 1,
    bio: 1,
    dateOfBirth: 1,
    address: 1,
  });

  const contributions = await getContributions(memberId);

  console.log("OUT - getMembersService");

  return {
    ...member,
    contributions,
  };
};

async function getContributions(memberId: string) {
  console.log("IN - getContributions");

  const contributions = await ContributionModel.findOne(
    { memberId, year: new Date().getFullYear() },
    { _id: 0, memberId: 1, year: 1, months: 1 }
  );

  console.log("OUT - getContributions");
  return contributions;
}
