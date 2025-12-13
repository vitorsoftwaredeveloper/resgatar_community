import {
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { MemberModel } from "../../models/Member";
import { SignUpPayload, SignUpPayloadDTO } from "../../types/members";
import { DUPLICATE_KEY_ERROR_CODE, STATUS_CODE } from "../../constants";
import { createCognitoClient } from "../../utils/cognito";
import { removeMemberService } from "./remove";

export const signUpService = async (payload: SignUpPayload): Promise<any> => {
  console.log("IN - signUpService");

  try {
    const cognito = createCognitoClient();
    payload["_id"] = await createCognitoUser(
      cognito,
      payload.email,
      payload.password
    );

    return await createMember(payload);
  } catch (error) {
    await removeMemberService(payload._id as string);

    throw error;
  } finally {
    console.log("OUT - signUpService");
  }
};

const createCognitoUser = async (
  cognito: CognitoIdentityProviderClient,
  email: string,
  password: string
): Promise<string> => {
  console.log("IN - createCognitoUser");

  let idMember = "";
  try {
    await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: process.env.USER_POOL_ID!,
        Username: email,
        TemporaryPassword: "Temp123!",
      })
    );

    await cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: process.env.USER_POOL_ID!,
        Username: email,
        Password: password,
        Permanent: true,
      })
    );

    const member = await cognito.send(
      new AdminGetUserCommand({
        UserPoolId: process.env.USER_POOL_ID!,
        Username: email,
      })
    );

    idMember = member.UserAttributes?.find((attr) => attr.Name === "sub")
      ?.Value as string;
  } catch (error) {
    console.error("Error creating Cognito user:", error);
    throw error;
  }

  console.log("OUT - createCognitoUser");
  return idMember;
};

const createMember = async (payload: SignUpPayload): Promise<any> => {
  console.log("IN - createMember");

  const memberData: SignUpPayloadDTO = {
    _id: payload._id,
    email: payload.email,
    status: "active",
    phoneNumber: payload.phoneNumber,
    name: payload.name,
    bio: payload.bio,
    age: payload.age,
    address: payload.address,
    paymentInfo: {
      datePayment: payload.paymentInfo.datePayment,
      amount: payload.paymentInfo.amount,
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

  console.log("OUT - createMember");
  return memberData._id;
};
