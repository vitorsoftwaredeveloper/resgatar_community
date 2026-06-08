import * as admin from "firebase-admin";

let initialized = false;

const getFirebaseApp = (): admin.app.App => {
  if (!initialized) {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT as string, "base64").toString("utf8")
    );
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    initialized = true;
  }
  return admin.app();
};

export const sendPushNotificationToAll = async (
  title: string,
  body: string
): Promise<void> => {
  console.log("IN - sendPushNotificationToAll");

  const app = getFirebaseApp();

  await app.messaging().send({
    notification: { title, body },
    topic: "todos_usuarios",
  });

  console.log("OUT - sendPushNotificationToAll");
};
