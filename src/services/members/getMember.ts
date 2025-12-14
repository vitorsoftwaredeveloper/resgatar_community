import { IMember } from "../../types/members";
import { findMemberById } from "./helper";

export const getMemberService = async (memberId: string): Promise<IMember> => {
  console.log("IN - getMembersService");

  try {
    return await findMemberById(memberId, {
      _id: 0,
      email: 1,
      phoneNumber: 1,
      role: 1,
      paymentInfo: 1,
      identification: 1,
      status: 1,
      firstName: 1,
      lastName: 1,
    });
  } catch (err) {
    throw err;
  } finally {
    console.log("OUT - getMembersService");
  }
};
