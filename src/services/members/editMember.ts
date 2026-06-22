import { MemberModel } from "../../models/Member";
import { IMember } from "../../types/members";
import { updateMemberCognitoEmail } from "../../utils/cognito";
import { executeMongoTransaction } from "../../utils/mongoose";
import { findMemberById } from "../helper";
import { encrypt } from "../../utils/crypto";

export const editMemberService = async (
  memberId: string,
  payload: Partial<IMember>,
) => {
  console.log("IN - editMemberService");

  const member = await findMemberById(memberId);
  try {
    const updatedMember: IMember = {
      ...member,
      ...(payload.email !== undefined && { email: payload.email }),
      ...(payload.phoneNumber !== undefined && {
        phoneNumber: payload.phoneNumber,
      }),
      ...(payload.firstName !== undefined && { firstName: payload.firstName }),
      ...(payload.lastName !== undefined && { lastName: payload.lastName }),
      ...(payload.bio !== undefined && { bio: payload.bio }),
      ...(payload.profileImage !== undefined && {
        profileImage: payload.profileImage,
      }),
      ...(payload.dateOfBirth !== undefined && {
        dateOfBirth: payload.dateOfBirth,
      }),
      ...(payload.address !== undefined && { address: payload.address }),
      ...(payload.paymentInfo !== undefined && {
        paymentInfo: {
          datePayment:
            payload.paymentInfo.datePayment ?? member.paymentInfo.datePayment,
          amount: payload.paymentInfo.amount ?? member.paymentInfo.amount,
        },
      }),
      ...(payload.identification !== undefined && {
        identification: {
          type: payload.identification.type,
          numberType: encrypt(payload.identification.numberType),
        },
      }),
    };

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
