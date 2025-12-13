import {
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { MemberModel } from "../../models/Member";
import { SignUpPayload, SignUpPayloadDTO } from "../../types/members";
import { DUPLICATE_KEY_ERROR_CODE, STATUS_CODES } from "../../constants";
import { createCognitoClient } from "../../utils/cognito";
import { executeMongoTransaction } from "../../utils/mongoose";
import { ClientSession } from "mongoose";

export const signUpService = async (payload: SignUpPayload): Promise<any> => {
  console.log("IN - signUpService");

  try {
    let newMember;
    await executeMongoTransaction(async (session) => {
      newMember = await createMember(payload, session);

      const cognito = createCognitoClient();
      await createCognitoUser(cognito, payload.email, payload.password);
    });

    return newMember;
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - signUpService");
  }
};

const createCognitoUser = async (
  cognito: CognitoIdentityProviderClient,
  email: string,
  password: string
): Promise<void> => {
  console.log("IN - createCognitoUser");

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
  } catch (error) {
    console.error("Error creating Cognito user:", error);
    throw error;
  }

  console.log("OUT - createCognitoUser");
};

const createMember = async (
  payload: SignUpPayload,
  session: ClientSession
): Promise<any> => {
  console.log("IN - createMember");

  const memberData: SignUpPayloadDTO = {
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

  await MemberModel.insertOne(memberData, { session }).catch((error) => {
    if (error.code === DUPLICATE_KEY_ERROR_CODE) {
      throw {
        statusCode: STATUS_CODES.BAD_REQUEST,
        message: "Member with this email already exists.",
      };
    }
    throw error;
  });

  console.log("OUT - createMember");
  return memberData;
};
