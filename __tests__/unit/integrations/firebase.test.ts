const sendMock = jest.fn();
const sendEachForMulticastMock = jest.fn();
const subscribeToTopicMock = jest.fn();
const unsubscribeFromTopicMock = jest.fn();
const messagingMock = jest.fn().mockReturnValue({
  send: sendMock,
  sendEachForMulticast: sendEachForMulticastMock,
  subscribeToTopic: subscribeToTopicMock,
  unsubscribeFromTopic: unsubscribeFromTopicMock,
});
const appMock = { messaging: messagingMock };

jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  credential: { cert: jest.fn().mockReturnValue({}) },
  app: jest.fn().mockReturnValue(appMock),
}));

import {
  ALL_USERS_TOPIC,
  sendPushNotificationToAll,
  sendPushNotificationToTokens,
  subscribeTokensToTopic,
  unsubscribeTokensFromTopic,
} from "../../../src/integrations/firebase";

const FAKE_SERVICE_ACCOUNT = Buffer.from(
  JSON.stringify({ type: "service_account", project_id: "test" })
).toString("base64");

beforeEach(() => {
  process.env.FIREBASE_SERVICE_ACCOUNT = FAKE_SERVICE_ACCOUNT;
  sendMock.mockResolvedValue({});
  sendEachForMulticastMock.mockResolvedValue({
    successCount: 1,
    failureCount: 0,
    responses: [{ success: true }],
  });
  subscribeToTopicMock.mockResolvedValue({ successCount: 1, failureCount: 0 });
  unsubscribeFromTopicMock.mockResolvedValue({ successCount: 1, failureCount: 0 });
});

afterEach(() => {
  delete process.env.FIREBASE_SERVICE_ACCOUNT;
  jest.clearAllMocks();
});

describe("sendPushNotificationToAll", () => {
  it("should call messaging().send with correct title, body and topic", async () => {
    await sendPushNotificationToAll("Título", "Mensagem");

    expect(sendMock).toHaveBeenCalledWith({
      notification: { title: "Título", body: "Mensagem" },
      topic: "todos_usuarios",
    });
  });

  it("should send to topic todos_usuarios", async () => {
    await sendPushNotificationToAll("T", "M");

    const call = sendMock.mock.calls[0][0];
    expect(call.topic).toBe("todos_usuarios");
  });

  it("should resolve without returning a value on success", async () => {
    const result = await sendPushNotificationToAll("T", "M");

    expect(result).toBeUndefined();
  });

  it("should throw when Firebase send fails", async () => {
    sendMock.mockRejectedValue(new Error("Firebase error"));

    await expect(sendPushNotificationToAll("T", "M")).rejects.toThrow("Firebase error");
  });
});

describe("sendPushNotificationToTokens", () => {
  const tokens = ["token-1", "token-2", "token-3"];

  it("should return empty array when tokens list is empty", async () => {
    const result = await sendPushNotificationToTokens([], "T", "M");

    expect(result).toEqual([]);
    expect(sendEachForMulticastMock).not.toHaveBeenCalled();
  });

  it("should call messaging().sendEachForMulticast with tokens, title and body", async () => {
    await sendPushNotificationToTokens(tokens, "Título", "Mensagem");

    expect(sendEachForMulticastMock).toHaveBeenCalledWith({
      tokens,
      notification: { title: "Título", body: "Mensagem" },
    });
  });

  it("should include the data payload when provided", async () => {
    await sendPushNotificationToTokens(tokens, "Título", "Mensagem", {
      type: "PAYMENT_CONFIRMED",
      paymentMethod: "cash",
    });

    expect(sendEachForMulticastMock).toHaveBeenCalledWith({
      tokens,
      notification: { title: "Título", body: "Mensagem" },
      data: { type: "PAYMENT_CONFIRMED", paymentMethod: "cash" },
    });
  });

  it("should omit the data key when no data is provided", async () => {
    await sendPushNotificationToTokens(tokens, "Título", "Mensagem");

    const callArg = sendEachForMulticastMock.mock.calls[0][0];
    expect(callArg).not.toHaveProperty("data");
  });

  it("should return empty array when all tokens succeed", async () => {
    sendEachForMulticastMock.mockResolvedValue({
      successCount: 3,
      failureCount: 0,
      responses: [
        { success: true },
        { success: true },
        { success: true },
      ],
    });

    const result = await sendPushNotificationToTokens(tokens, "T", "M");

    expect(result).toEqual([]);
  });

  it("should return invalid tokens when registration-token-not-registered", async () => {
    sendEachForMulticastMock.mockResolvedValue({
      successCount: 2,
      failureCount: 1,
      responses: [
        { success: true },
        { success: false, error: { code: "messaging/registration-token-not-registered" } },
        { success: true },
      ],
    });

    const result = await sendPushNotificationToTokens(tokens, "T", "M");

    expect(result).toEqual(["token-2"]);
  });

  it("should return invalid tokens when invalid-registration-token", async () => {
    sendEachForMulticastMock.mockResolvedValue({
      successCount: 2,
      failureCount: 1,
      responses: [
        { success: false, error: { code: "messaging/invalid-registration-token" } },
        { success: true },
        { success: true },
      ],
    });

    const result = await sendPushNotificationToTokens(tokens, "T", "M");

    expect(result).toEqual(["token-1"]);
  });

  it("should NOT return token when failure is due to other error codes", async () => {
    sendEachForMulticastMock.mockResolvedValue({
      successCount: 2,
      failureCount: 1,
      responses: [
        { success: true },
        { success: true },
        { success: false, error: { code: "messaging/internal-error" } },
      ],
    });

    const result = await sendPushNotificationToTokens(tokens, "T", "M");

    expect(result).toEqual([]);
  });

  it("should return multiple invalid tokens when several fail", async () => {
    sendEachForMulticastMock.mockResolvedValue({
      successCount: 1,
      failureCount: 2,
      responses: [
        { success: false, error: { code: "messaging/invalid-registration-token" } },
        { success: true },
        { success: false, error: { code: "messaging/registration-token-not-registered" } },
      ],
    });

    const result = await sendPushNotificationToTokens(tokens, "T", "M");

    expect(result).toEqual(["token-1", "token-3"]);
  });

  it("should throw when Firebase sendEachForMulticast fails", async () => {
    sendEachForMulticastMock.mockRejectedValue(new Error("Firebase error"));

    await expect(
      sendPushNotificationToTokens(tokens, "T", "M")
    ).rejects.toThrow("Firebase error");
  });
});

describe("sendPushNotificationToTokens batching", () => {
  it("should split the send into batches of 500 tokens", async () => {
    const manyTokens = Array.from({ length: 1200 }, (_, i) => `token-${i}`);

    sendEachForMulticastMock.mockImplementation(async ({ tokens }: any) => ({
      successCount: tokens.length,
      failureCount: 0,
      responses: tokens.map(() => ({ success: true })),
    }));

    await sendPushNotificationToTokens(manyTokens, "T", "M");

    expect(sendEachForMulticastMock).toHaveBeenCalledTimes(3);
    expect(sendEachForMulticastMock.mock.calls[0][0].tokens).toHaveLength(500);
    expect(sendEachForMulticastMock.mock.calls[1][0].tokens).toHaveLength(500);
    expect(sendEachForMulticastMock.mock.calls[2][0].tokens).toHaveLength(200);
  });

  it("should map invalid tokens back to the right batch offset", async () => {
    const manyTokens = Array.from({ length: 600 }, (_, i) => `token-${i}`);

    sendEachForMulticastMock.mockImplementation(async ({ tokens }: any) => ({
      successCount: tokens.length - 1,
      failureCount: 1,
      responses: tokens.map((_: string, i: number) =>
        i === 0
          ? { success: false, error: { code: "messaging/invalid-registration-token" } }
          : { success: true }
      ),
    }));

    const result = await sendPushNotificationToTokens(manyTokens, "T", "M");

    expect(result).toEqual(["token-0", "token-500"]);
  });
});

describe("subscribeTokensToTopic", () => {
  it("should subscribe to the broadcast topic by default", async () => {
    await subscribeTokensToTopic(["token-1"]);

    expect(subscribeToTopicMock).toHaveBeenCalledWith(["token-1"], ALL_USERS_TOPIC);
  });

  it("should accept an explicit topic", async () => {
    await subscribeTokensToTopic(["token-1"], "outro_topico");

    expect(subscribeToTopicMock).toHaveBeenCalledWith(["token-1"], "outro_topico");
  });

  it("should do nothing when the token list is empty", async () => {
    await subscribeTokensToTopic([]);

    expect(subscribeToTopicMock).not.toHaveBeenCalled();
  });

  it("should split the subscription into batches of 1000 tokens", async () => {
    const manyTokens = Array.from({ length: 2500 }, (_, i) => `token-${i}`);

    await subscribeTokensToTopic(manyTokens);

    expect(subscribeToTopicMock).toHaveBeenCalledTimes(3);
    expect(subscribeToTopicMock.mock.calls[0][0]).toHaveLength(1000);
    expect(subscribeToTopicMock.mock.calls[2][0]).toHaveLength(500);
  });

  it("should throw when Firebase subscribeToTopic fails", async () => {
    subscribeToTopicMock.mockRejectedValue(new Error("Firebase error"));

    await expect(subscribeTokensToTopic(["token-1"])).rejects.toThrow("Firebase error");
  });
});

describe("unsubscribeTokensFromTopic", () => {
  it("should unsubscribe from the broadcast topic by default", async () => {
    await unsubscribeTokensFromTopic(["token-1"]);

    expect(unsubscribeFromTopicMock).toHaveBeenCalledWith(["token-1"], ALL_USERS_TOPIC);
  });

  it("should do nothing when the token list is empty", async () => {
    await unsubscribeTokensFromTopic([]);

    expect(unsubscribeFromTopicMock).not.toHaveBeenCalled();
  });

  it("should split the unsubscription into batches of 1000 tokens", async () => {
    const manyTokens = Array.from({ length: 1001 }, (_, i) => `token-${i}`);

    await unsubscribeTokensFromTopic(manyTokens);

    expect(unsubscribeFromTopicMock).toHaveBeenCalledTimes(2);
    expect(unsubscribeFromTopicMock.mock.calls[1][0]).toHaveLength(1);
  });
});
