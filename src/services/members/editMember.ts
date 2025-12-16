import { MemberModel } from "../../models/Member";
import { IMember } from "../../types/members";
import { updateMemberCognitoEmail } from "../../utils/cognito";
import { executeMongoTransaction } from "../../utils/mongoose";
import { findMemberById } from "./helper";

export const editMemberService = async (
  memberId: string,
  payload: Partial<IMember>
) => {
  console.log("IN - editMemberService");

  const member = await findMemberById(memberId);
  try {
    const updatedMember: Partial<IMember> = {
      ...member,
      ...payload,
    };

    console.log("Member to be updated:", updatedMember);

    await executeMongoTransaction(async (session) => {
      await MemberModel.updateOne({ _id: memberId }, updatedMember, {
        session,
      });

      if (payload.email && member.email !== payload.email) {
        await updateMemberCognitoEmail(member._id, payload.email as string);
      }
    });

    return updatedMember;
  } catch (err) {
    throw err;
  } finally {
    console.log("OUT - editMemberService");
  }
};
