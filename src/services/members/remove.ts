import { AdminDeleteUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { createCognitoClient } from "../../utils/cognito";
import { MemberModel } from "../../models/Member";

export const removeMemberService = async (idMember: string): Promise<void> => {
  console.log("IN - removeMemberService");

  try {
    const cognito = createCognitoClient();

    await cognito.send(
      new AdminDeleteUserCommand({
        UserPoolId: process.env.USER_POOL_ID!,
        Username: idMember,
      })
    );

    await MemberModel.deleteOne({ _id: idMember });
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - removeMemberService");
  }
};
