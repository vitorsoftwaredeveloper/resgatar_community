import { MemberModel } from "../../models/Member";
import { IMember } from "../../types/members";
import { updateMemberCognitoEmail } from "../../utils/cognito";
import { executeMongoTransaction } from "../../utils/mongoose";
import { findMemberById } from "../helper";

export const editMemberService = async (
  memberId: string,
  payload: Partial<IMember>
) => {
  console.log("IN - editMemberService");

  const member = await findMemberById(memberId);
  try {
    const updatedMember: IMember = {
      ...member,
      ...(payload.email && { email: payload.email }),
      ...(payload.phoneNumber && { phoneNumber: payload.phoneNumber }),
      ...(payload.firstName && { firstName: payload.firstName }),
      ...(payload.lastName && { lastName: payload.lastName }),
      ...(payload.bio && { bio: payload.bio }),
      ...(payload.dateOfBirth && { dateOfBirth: payload.dateOfBirth }),
      ...(payload.address && { address: payload.address }),
      ...(payload.paymentInfo && {
        paymentInfo: {
          datePayment: payload.paymentInfo.datePayment
            ? payload.paymentInfo.datePayment
            : member.paymentInfo.datePayment,
          amount: payload.paymentInfo.amount
            ? payload.paymentInfo.amount
            : member.paymentInfo.amount,
        },
      }),
      ...(payload.identification && { identification: payload.identification }),
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
