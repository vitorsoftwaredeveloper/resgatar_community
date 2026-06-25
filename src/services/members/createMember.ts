import { MemberModel } from "../../models/Member";
import { ISignUpPayload, IMember } from "../../types/members";
import { DUPLICATE_KEY_ERROR_CODE, STATUS_CODE } from "../../constants";
import { createCognitoUser, removeMemberCognito } from "../../utils/cognito";
import { createContributionByYear, findMemberByEmail } from "../helper";
import { encrypt } from "../../utils/crypto";

export const createMemberService = async (
  payload: ISignUpPayload,
): Promise<any> => {
  console.log("IN - createMemberService");

  try {
    await ensureEmailIsAvailable(payload.email);

    payload["_id"] = await createCognitoUser(payload.email, payload.password);

    return await createMember(payload);
  } catch (error) {
    if (payload._id) {
      await removeMemberCognito(payload._id).catch((rollbackError) => {
        console.error("Failed to rollback Cognito user:", rollbackError);
      });
    }

    throw normalizeSignUpError(error);
  } finally {
    console.log("OUT - createMemberService");
  }
};

const ensureEmailIsAvailable = async (email: string): Promise<void> => {
  const existingMember = await findMemberByEmail(email, { _id: 1 });

  if (existingMember) {
    throw {
      statusCode: STATUS_CODE.CONFLICT,
      message: "Não foi possível concluir o cadastro com este email.",
    };
  }
};

const normalizeSignUpError = (error: any) => {
  if (error?.name === "UsernameExistsException") {
    return {
      statusCode: STATUS_CODE.CONFLICT,
      message: "Não foi possível concluir o cadastro com este email.",
    };
  }

  return error;
};

const createMember = async (payload: ISignUpPayload): Promise<any> => {
  console.log("IN - createMember");

  const memberData: IMember = {
    _id: payload._id,
    email: payload.email,
    status: "active",
    phoneNumber: payload.phoneNumber,
    firstName: payload.firstName,
    lastName: payload.lastName,
    bio: payload.bio,
    profileImage: payload.profileImage,
    dateOfBirth: payload.dateOfBirth,
    address: payload.address,
    paymentInfo: payload.paymentInfo,
    identification: {
      type: payload.identification.type,
      numberType: encrypt(payload.identification.numberType),
    },
    role: "user",
  };

  await MemberModel.insertOne(memberData).catch(async (error) => {
    if (error.code === DUPLICATE_KEY_ERROR_CODE) {
      throw {
        statusCode: STATUS_CODE.CONFLICT,
        message: "Não foi possível concluir o cadastro com este email.",
      };
    }
    throw error;
  });

  await createContributionByYear(
    payload._id,
    new Date().getFullYear(),
    new Date().getMonth(),
  );

  console.log("OUT - createMember");
  return memberData._id;
};
