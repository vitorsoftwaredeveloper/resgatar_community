import { MemberModel } from "../../models/Member";
import { IMember, MemberRole } from "../../types/members";
import { updateMemberCognitoEmail } from "../../utils/cognito";
import { executeMongoTransaction } from "../../utils/mongoose";
import {
  countAdmins,
  ensureContributionForCurrentYear,
  findMemberById,
  verifyAdmin,
} from "../helper";
import { encrypt } from "../../utils/crypto";
import { STATUS_CODE } from "../../constants";
import { MEMBER_ROLES } from "../../constants/members";

const assertRoleChangeAllowed = async (
  requesterId: string,
  member: IMember,
  nextRole: MemberRole,
): Promise<void> => {
  console.log("IN - assertRoleChangeAllowed");

  if (requesterId === member._id) {
    throw {
      statusCode: STATUS_CODE.FORBIDDEN,
      message: "Não é possível alterar o próprio nível de acesso.",
    };
  }

  const isDemotingAdmin =
    member.role === MEMBER_ROLES.ADMIN && nextRole !== MEMBER_ROLES.ADMIN;

  if (isDemotingAdmin && (await countAdmins()) <= 1) {
    throw {
      statusCode: STATUS_CODE.CONFLICT,
      message: "A comunidade precisa de ao menos um administrador.",
    };
  }

  console.log("OUT - assertRoleChangeAllowed");
};

export const editMemberService = async (
  requesterId: string,
  memberId: string,
  payload: Partial<IMember>,
) => {
  console.log("IN - editMemberService");

  if (requesterId !== memberId) {
    await verifyAdmin(requesterId);
  }

  if (payload.role !== undefined) {
    await verifyAdmin(requesterId);
  }

  const member = await findMemberById(memberId);

  const isPromotingFromGuest =
    payload.role !== undefined &&
    member.role === MEMBER_ROLES.GUEST &&
    payload.role !== MEMBER_ROLES.GUEST;

  if (payload.role !== undefined) {
    await assertRoleChangeAllowed(requesterId, member, payload.role);
  }

  try {
    const updatedMember: IMember = {
      ...member,
      ...(payload.email !== undefined && { email: payload.email }),
      ...(payload.role !== undefined && { role: payload.role }),
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

      if (isPromotingFromGuest) {
        await ensureContributionForCurrentYear(memberId);
      }

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
