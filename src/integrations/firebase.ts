import * as admin from "firebase-admin";

let initialized = false;

const getFirebaseApp = (): admin.app.App => {
  if (!initialized) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!raw) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT is not configured");
    }

    const serviceAccount = JSON.parse(
      Buffer.from(raw, "base64").toString("utf8"),
    );

    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    initialized = true;
  }

  return admin.app();
};

export const getMessagingClient = (): admin.messaging.Messaging =>
  getFirebaseApp().messaging();
