import { STATUS_CODE } from "../../constants";
import { MEMBER_ROLES } from "../../constants/members";
import { MemberModel } from "../../models/Member";
import { IMember } from "../../types/members";

export const listMembersService = async (
  memberId: string
): Promise<Array<IMember>> => {
  console.log("IN - listMembersService");

  const member = await findMemberById(memberId);

  if (!member) {
    throw new Error("Member not found", { cause: 404 });
  }

  if (!isAdmin(member)) {
    throw {
      message: "Unauthorized access",
      statusCode: STATUS_CODE.UNAUTHORIZED,
    };
  }

  const members = await MemberModel.find({});

  console.log("OUT - listMembersService");
  return members;
};

const findMemberById = async (memberId: string): Promise<IMember | null> => {
  console.log("IN - findMemberById");

  const member = await MemberModel.findById(memberId);

  console.log("OUT - findMemberById");
  return member;
};

const isAdmin = (member: IMember): boolean => {
  console.log("IN - isAdmin");

  const admin = member.role === MEMBER_ROLES.ADMIN;

  console.log("OUT - isAdmin");

  return admin;
};
