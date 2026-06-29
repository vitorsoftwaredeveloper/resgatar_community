import { verifyAdmin } from "../helper";
import { purgeMember } from "./helper";

export const removeMemberService = async (
  requesterId: string,
  idMember: string,
): Promise<void> => {
  console.log("IN - removeMemberService");

  if (requesterId !== idMember) {
    await verifyAdmin(requesterId);
  }

  try {
    await purgeMember(idMember);
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - removeMemberService");
  }
};
