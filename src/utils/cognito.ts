import {
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand,
  AdminSetUserPasswordCommand,
  AdminCreateUserCommand,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const createCognitoClient = () => {
  console.log("IN - createCognitoClient");

  const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.REGION,
  });

  console.log("OUT - createCognitoClient");
  return cognitoClient;
};

const createCognitoUser = async (
  email: string,
  password: string
): Promise<string> => {
  console.log("IN - createCognitoUser");

  const cognito = createCognitoClient();

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

const changeCognitoPassword = async (
  memberId: string,
  newPassword: string
): Promise<void> => {
  console.log("IN - changeCognitoPassword");

  const cognito = createCognitoClient();

  try {
    await cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: process.env.USER_POOL_ID!,
        Username: memberId,
        Password: newPassword,
        Permanent: true,
      })
    );
  } catch (error) {
    console.error(error);
    throw error;
  }

  console.log("OUT - changeCognitoPassword");
};

export {
  removeMemberCognito,
  updateMemberCognitoEmail,
  changeCognitoPassword,
  createCognitoUser,
};
