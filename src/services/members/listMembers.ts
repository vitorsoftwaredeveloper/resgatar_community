import { STATUS_CODE } from "../../constants";
import { MEMBER_ROLES } from "../../constants/members";
import { MemberModel } from "../../models/Member";
import { IMember } from "../../types/members";
import { verifyAdmin } from "./helper";

export const listMembersService = async (
  memberId: string
): Promise<Array<IMember>> => {
  console.log("IN - listMembersService");

  await verifyAdmin(memberId);

  const members = await MemberModel.find({});

  console.log("OUT - listMembersService");
  return members;
};
