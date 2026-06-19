import * as admin from "firebase-admin";

let initialized = false;
const INVALID_TOKEN_CODES = [
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
];

const getFirebaseApp = (): admin.app.App => {
  if (!initialized) {
    const serviceAccount = JSON.parse(
      Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT as string,
        "base64",
      ).toString("utf8"),
    );
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    initialized = true;
  }
  return admin.app();
};

export const sendPushNotificationToAll = async (
  title: string,
  body: string,
): Promise<void> => {
  console.log("IN - sendPushNotificationToAll");

  const app = getFirebaseApp();

  await app.messaging().send({
    notification: { title, body },
    topic: "todos_usuarios",
  });

  console.log("OUT - sendPushNotificationToAll");
};

export const sendPushNotificationToTokens = async (
  tokens: string[],
  title: string,
  body: string,
): Promise<string[]> => {
  console.log("IN - sendPushNotificationToTokens", { count: tokens.length });

  if (tokens.length === 0) return [];

  const app = getFirebaseApp();

  const response = await app.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
  });

  console.log("sendPushNotificationToTokens", {
    successCount: response.successCount,
    failureCount: response.failureCount,
  });

  const invalidTokens = response.responses
    .map((r, i) =>
      !r.success && INVALID_TOKEN_CODES.includes(r.error?.code ?? "")
        ? tokens[i]
        : null,
    )
    .filter((t): t is string => t !== null);

  console.log("OUT - sendPushNotificationToTokens");

  return invalidTokens;
};
