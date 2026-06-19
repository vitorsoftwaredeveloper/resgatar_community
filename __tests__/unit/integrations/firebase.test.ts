const sendMock = jest.fn();
const sendEachForMulticastMock = jest.fn();
const messagingMock = jest.fn().mockReturnValue({
  send: sendMock,
  sendEachForMulticast: sendEachForMulticastMock,
});
const appMock = { messaging: messagingMock };

jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  credential: { cert: jest.fn().mockReturnValue({}) },
  app: jest.fn().mockReturnValue(appMock),
}));

import {
  sendPushNotificationToAll,
  sendPushNotificationToTokens,
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
