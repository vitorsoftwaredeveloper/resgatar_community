import {
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const createCognitoClient = () => {
  console.log("IN - createCognitoClient");

  const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.REGION,
  });

  console.log("OUT - createCognitoClient");
  return cognitoClient;
};

const removeMemberCognito = async (memberId: string): Promise<void> => {
  console.log("IN - removeMemberCognito");

  const cognito = createCognitoClient();

  try {
    await cognito.send(
      new AdminDeleteUserCommand({
        UserPoolId: process.env.USER_POOL_ID!,
        Username: memberId,
      })
    );
  } catch (error) {
    console.error(error);
    throw error;
  }

  console.log("OUT - removeMemberCognito");
};

const updateMemberCognitoEmail = async (
  memberId: string,
  newEmail: string
): Promise<void> => {
  console.log("IN - updateMemberCognitoEmail");

  const cognito = createCognitoClient();

  try {
    await cognito.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: process.env.USER_POOL_ID!,
        Username: memberId,
        UserAttributes: [
          {
            Name: "email",
            Value: newEmail,
          },
          {
            Name: "email_verified",
            Value: "true",
          },
        ],
      })
    );
  } catch (error) {
    console.error(error);
    throw error;
  }

  console.log("OUT - updateMemberCognitoEmail");
};
export { createCognitoClient, removeMemberCognito, updateMemberCognitoEmail };
