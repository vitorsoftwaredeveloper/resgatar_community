import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

const createCognitoClient = () => {
  console.log("IN - createCognitoClient");

  const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.REGION,
  });

  console.log("OUT - createCognitoClient");
  return cognitoClient;
};

export { createCognitoClient };
