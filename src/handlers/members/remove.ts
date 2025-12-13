import { removeMemberService } from "../../services/members/remove";

export const execute = async (idMember: string): Promise<void> => {
  console.log("IN - removeMember");

  try {
    await removeMemberService(idMember);
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - removeMember");
  }
};
