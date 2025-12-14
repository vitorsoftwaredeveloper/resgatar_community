import { STATUS_CODE } from "../../constants";
import { MEMBER_ROLES } from "../../constants/members";
import { MemberModel } from "../../models/Member";
import { IMember } from "../../types/members";

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

const verifyAdmin = async (memberId: string): Promise<void> => {
  console.log("IN - verifyAdmin");

  const member = await findMemberById(memberId);

  if (!isAdmin(member as IMember)) {
    throw {
      message: "Unauthorized access",
      statusCode: STATUS_CODE.UNAUTHORIZED,
    };
  }

  console.log("OUT - verifyAdmin");
};

export { verifyAdmin };
