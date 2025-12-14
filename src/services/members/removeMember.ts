import { AdminDeleteUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { createCognitoClient } from "../../utils/cognito";
import { MemberModel } from "../../models/Member";
import { verifyAdmin } from "./helper";

export const removeMemberService = async (
  adminId: string,
  idMember: string
): Promise<void> => {
  console.log("IN - removeMemberService");

  await verifyAdmin(adminId);

  try {
    await removeMemberCognito(idMember);

    await MemberModel.deleteOne({ _id: idMember });
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - removeMemberService");
  }
};

const removeMemberCognito = async (idMember: string): Promise<void> => {
  console.log("IN - removeMemberCognito");

  const cognito = createCognitoClient();

  await cognito.send(
    new AdminDeleteUserCommand({
      UserPoolId: process.env.USER_POOL_ID!,
      Username: idMember,
    })
  );

  console.log("OUT - removeMemberCognito");
};
