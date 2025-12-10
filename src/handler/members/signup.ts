import { APIGatewayEvent } from "aws-lambda";
import { db } from "../../db";
import { MemberModel } from "../../model/Member";
import {
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";

export const execute = async (event: APIGatewayEvent) => {
  const cognito = new CognitoIdentityProviderClient({
    region: process.env.REGION,
  });

  const { email, password } = event.body ? JSON.parse(event.body) : {};

  try {
    await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: process.env.USER_POOL_ID,
        Username: email,
        TemporaryPassword: "Temp123!",
      })
    );

    await cognito
      .send(
        new AdminSetUserPasswordCommand({
          UserPoolId: process.env.USER_POOL_ID,
          Username: email,
          Password: password,
          Permanent: true,
        })
      )
      .then(() => {
        console.log("Senha definida com sucesso!");
      });

    return {
      success: true,
      message: "Usuário criado com sucesso!",
    };
  } catch (error) {
    console.error(error);
    return { success: false, error };
  }
};
