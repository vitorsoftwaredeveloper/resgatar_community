import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";

import { MemberModel } from "../../model/Member";
import {
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { validate } from "../../utils/validate";
import { SignUpValidatorSchema } from "./validation/signup";
import { SignUpPayload, SignUpPayloadDTO } from "../../types/members";

export const execute = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const payload = parseRequestBody(event.body) as any;

    const errors = validate(SignUpValidatorSchema, payload);
    if (errors.length > 0) {
      return sendErrorResponse({
        statusCode: 400,
        message: "Validation Error",
        errors,
      });
    }

    const cognito = createCognitoClient();

    await createCognitoUser(cognito, payload.email, payload.password);
    const newMember = await createMember(payload);

    return sendSuccessResponse(newMember);
  } catch (error) {
    return sendErrorResponse(error);
  }
};

const createCognitoClient = () => {
  console.log("IN - createCognitoClient");

  const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.REGION,
  });

  console.log("OUT - createCognitoClient");
  return cognitoClient;
};

const parseRequestBody = (body: string | null): SignUpPayload | null => {
  console.log("IN - parseRequestBody");

  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - parseRequestBody");
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

const createMember = async (payload: SignUpPayload): Promise<any> => {
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

  await MemberModel.insertOne(memberData);

  console.log("OUT - createMember");
  return memberData;
};

const sendErrorResponse = (error: any): APIGatewayProxyResult => ({
  statusCode: error.statusCode || 500,
  body: JSON.stringify({
    message: error.message || "Internal Server Error",
    errors: error.errors || null,
  }),
});

const sendSuccessResponse = (data: any): APIGatewayProxyResult => ({
  statusCode: 201,
  body: JSON.stringify({
    message: "Member created successfully!",
    data,
  }),
});
