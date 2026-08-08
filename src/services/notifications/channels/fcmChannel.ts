import * as admin from "firebase-admin";
import { getMessagingClient } from "../../../integrations/firebase";
import { IDevice } from "../../../types/devices";
import {
  INotificationPayload,
  ITokenSendResult,
} from "../../../types/notification";

const MULTICAST_BATCH_SIZE = 500;

const INVALID_TOKEN_CODES = [
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
  "messaging/registration-token-not-registered",
];

type MulticastBody = Omit<admin.messaging.MulticastMessage, "tokens">;

const toAbsoluteLink = (link?: string): string | undefined => {
  if (!link) return undefined;
  if (/^https?:\/\//.test(link)) return link;

  const base = (process.env.FRONTEND_URL ?? "").replace(/\/$/, "");
  if (!base) return undefined;

  return `${base}${link.startsWith("/") ? link : `/${link}`}`;
};

const chunk = <T>(items: T[], size: number): T[][] => {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
};

const buildData = (payload: INotificationPayload): Record<string, string> => ({
  ...(payload.data ?? {}),
  title: payload.title,
  body: payload.body,
  ...(payload.link ? { url: payload.link } : {}),
});

const sendBatches = async (
  tokens: string[],
  body: MulticastBody,
): Promise<ITokenSendResult[]> => {
  if (tokens.length === 0) return [];

  const messaging = getMessagingClient();
  const results: ITokenSendResult[] = [];

  for (const batch of chunk(tokens, MULTICAST_BATCH_SIZE)) {
    const response = await messaging.sendEachForMulticast({
      ...body,
      tokens: batch,
    });

    response.responses.forEach((result, index) => {
      results.push({
        token: batch[index],
        success: result.success,
        invalidToken: INVALID_TOKEN_CODES.includes(result.error?.code ?? ""),
        error: result.error?.message,
      });
    });
  }

  return results;
};

const sendDataOnlyToWebTokens = (
  tokens: string[],
  payload: INotificationPayload,
): Promise<ITokenSendResult[]> => {
  const absoluteLink = toAbsoluteLink(payload.link);

  return sendBatches(tokens, {
    webpush: {
      headers: { Urgency: "high" },
      ...(absoluteLink ? { fcmOptions: { link: absoluteLink } } : {}),
    },
    data: buildData(payload),
  });
};

const sendNotificationBlockToNativeTokens = (
  tokens: string[],
  payload: INotificationPayload,
): Promise<ITokenSendResult[]> =>
  sendBatches(tokens, {
    notification: { title: payload.title, body: payload.body },
    data: buildData(payload),
  });

export const sendByFcm = async (
  devices: IDevice[],
  payload: INotificationPayload,
): Promise<ITokenSendResult[]> => {
  if (devices.length === 0) return [];

  const webTokens = devices
    .filter((device) => device.client === "web")
    .map((device) => device.token);

  const nativeTokens = devices
    .filter((device) => device.client !== "web")
    .map((device) => device.token);

  const [webResults, nativeResults] = await Promise.all([
    sendDataOnlyToWebTokens(webTokens, payload),
    sendNotificationBlockToNativeTokens(nativeTokens, payload),
  ]);

  return [...webResults, ...nativeResults];
};
