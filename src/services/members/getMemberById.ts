import { verifyAdmin } from "../helper";
import { getMemberService } from "./getMember";

export const getMemberByIdService = async (
  adminId: string,
  memberId: string,
) => {
  console.log("IN - getMemberByIdService");

  await verifyAdmin(adminId);

  const member = await getMemberService(memberId);

  console.log("OUT - getMemberByIdService");

  return member;
};
