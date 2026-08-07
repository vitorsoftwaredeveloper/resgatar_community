import * as admin from "firebase-admin";

let initialized = false;
const INVALID_TOKEN_CODES = [
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
];

export const ALL_USERS_TOPIC = "todos_usuarios";

const MULTICAST_BATCH_SIZE = 500;
const TOPIC_BATCH_SIZE = 1000;

const chunk = <T>(items: T[], size: number): T[][] => {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
};

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
    topic: ALL_USERS_TOPIC,
  });

  console.log("OUT - sendPushNotificationToAll");
};

export const sendPushNotificationToTokens = async (
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<string[]> => {
  console.log("IN - sendPushNotificationToTokens", { count: tokens.length });

  if (tokens.length === 0) return [];

  const app = getFirebaseApp();
  const invalidTokens: string[] = [];

  let successCount = 0;
  let failureCount = 0;

  for (const batch of chunk(tokens, MULTICAST_BATCH_SIZE)) {
    const response = await app.messaging().sendEachForMulticast({
      tokens: batch,
      notification: { title, body },
      ...(data && { data }),
    });

    successCount += response.successCount;
    failureCount += response.failureCount;

    response.responses.forEach((r, i) => {
      if (!r.success && INVALID_TOKEN_CODES.includes(r.error?.code ?? "")) {
        invalidTokens.push(batch[i]);
      }
    });
  }

  console.log("sendPushNotificationToTokens", { successCount, failureCount });

  console.log("OUT - sendPushNotificationToTokens");

  return invalidTokens;
};

export const subscribeTokensToTopic = async (
  tokens: string[],
  topic: string = ALL_USERS_TOPIC,
): Promise<void> => {
  console.log("IN - subscribeTokensToTopic", { count: tokens.length, topic });

  if (tokens.length === 0) return;

  const app = getFirebaseApp();

  for (const batch of chunk(tokens, TOPIC_BATCH_SIZE)) {
    const response = await app.messaging().subscribeToTopic(batch, topic);
    console.log("subscribeTokensToTopic", {
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  }

  console.log("OUT - subscribeTokensToTopic");
};

export const unsubscribeTokensFromTopic = async (
  tokens: string[],
  topic: string = ALL_USERS_TOPIC,
): Promise<void> => {
  console.log("IN - unsubscribeTokensFromTopic", {
    count: tokens.length,
    topic,
  });

  if (tokens.length === 0) return;

  const app = getFirebaseApp();

  for (const batch of chunk(tokens, TOPIC_BATCH_SIZE)) {
    const response = await app.messaging().unsubscribeFromTopic(batch, topic);
    console.log("unsubscribeTokensFromTopic", {
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  }

  console.log("OUT - unsubscribeTokensFromTopic");
};
