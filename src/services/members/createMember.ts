import { MemberModel } from "../../models/Member";
import { ISignUpPayload, IMember } from "../../types/members";
import { DUPLICATE_KEY_ERROR_CODE, STATUS_CODE } from "../../constants";
import { createCognitoUser, removeMemberCognito } from "../../utils/cognito";
import { removeMemberService } from "./removeMember";
import { createContributionByYear } from "../helper";
import { encrypt } from "../../utils/crypto";

export const createMemberService = async (
  payload: ISignUpPayload,
): Promise<any> => {
  console.log("IN - createMemberService");

  try {
    payload["_id"] = await createCognitoUser(payload.email, payload.password);

    return await createMember(payload);
  } catch (error) {
    await removeMemberCognito(payload._id as string);

    throw error;
  } finally {
    console.log("OUT - createMemberService");
  }
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
    dateOfBirth: payload.dateOfBirth,
    address: payload.address,
    paymentInfo: payload.paymentInfo,
    identification: {
      type: payload.identification.type,
      numberType: encrypt(payload.identification.numberType),
    },
    role: payload.role || "user",
  };

  await MemberModel.insertOne(memberData).catch(async (error) => {
    if (error.code === DUPLICATE_KEY_ERROR_CODE) {
      throw {
        statusCode: STATUS_CODE.BAD_REQUEST,
        message: "Member with this email already exists.",
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
