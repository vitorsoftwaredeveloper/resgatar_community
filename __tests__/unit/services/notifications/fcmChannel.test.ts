const sendEachForMulticastMock = jest.fn();
const messagingMock = jest.fn().mockReturnValue({
  sendEachForMulticast: sendEachForMulticastMock,
});
const appMock = { messaging: messagingMock };

jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  credential: { cert: jest.fn().mockReturnValue({}) },
  app: jest.fn().mockReturnValue(appMock),
}));

import { sendByFcm } from "../../../../src/services/notifications/channels/fcmChannel";
import { IDevice } from "../../../../src/types/devices";

const FAKE_SERVICE_ACCOUNT = Buffer.from(
  JSON.stringify({ type: "service_account", project_id: "test" }),
).toString("base64");

const makeDevice = (
  token: string,
  client: IDevice["client"] = "native",
): IDevice =>
  ({
    _id: token,
    memberId: "member-1",
    token,
    client,
    installed: false,
    lastUsedAt: new Date(),
  }) as IDevice;

const successResponse = ({ tokens }: any) => ({
  successCount: tokens.length,
  failureCount: 0,
  responses: tokens.map(() => ({ success: true })),
});

beforeEach(() => {
  process.env.FIREBASE_SERVICE_ACCOUNT = FAKE_SERVICE_ACCOUNT;
  process.env.FRONTEND_URL = "https://app.resgatar.test";
  sendEachForMulticastMock.mockImplementation(async (message: any) =>
    successResponse(message),
  );
});

afterEach(() => {
  delete process.env.FIREBASE_SERVICE_ACCOUNT;
  delete process.env.FRONTEND_URL;
  jest.clearAllMocks();
});

describe("sendByFcm", () => {
  it("should return an empty list when there is no device", async () => {
    const result = await sendByFcm([], { title: "T", body: "B" });

    expect(result).toEqual([]);
    expect(sendEachForMulticastMock).not.toHaveBeenCalled();
  });

  it("should send a notification block to native tokens", async () => {
    await sendByFcm([makeDevice("native-1")], { title: "T", body: "B" });

    const message = sendEachForMulticastMock.mock.calls[0][0];

    expect(message.tokens).toEqual(["native-1"]);
    expect(message.notification).toEqual({ title: "T", body: "B" });
  });

  it("should send data-only messages to web tokens", async () => {
    await sendByFcm([makeDevice("web-1", "web")], { title: "T", body: "B" });

    const message = sendEachForMulticastMock.mock.calls[0][0];

    expect(message.notification).toBeUndefined();
    expect(message.data).toMatchObject({ title: "T", body: "B" });
    expect(message.webpush.headers.Urgency).toBe("high");
  });

  it("should send a TTL so the push survives a device that is offline", async () => {
    await sendByFcm([makeDevice("web-1", "web")], { title: "T", body: "B" });

    const message = sendEachForMulticastMock.mock.calls[0][0];

    expect(message.webpush.headers.TTL).toBe("86400");
  });

  it("should turn a relative link into an absolute fcm link for web tokens", async () => {
    await sendByFcm([makeDevice("web-1", "web")], {
      title: "T",
      body: "B",
      link: "/bills",
    });

    const message = sendEachForMulticastMock.mock.calls[0][0];

    expect(message.webpush.fcmOptions.link).toBe(
      "https://app.resgatar.test/bills",
    );
    expect(message.data.url).toBe("/bills");
  });

  it("should keep an absolute link untouched", async () => {
    await sendByFcm([makeDevice("web-1", "web")], {
      title: "T",
      body: "B",
      link: "https://outro.example/x",
    });

    const message = sendEachForMulticastMock.mock.calls[0][0];

    expect(message.webpush.fcmOptions.link).toBe("https://outro.example/x");
  });

  it("should omit the fcm link when FRONTEND_URL is not configured", async () => {
    delete process.env.FRONTEND_URL;

    await sendByFcm([makeDevice("web-1", "web")], {
      title: "T",
      body: "B",
      link: "/bills",
    });

    const message = sendEachForMulticastMock.mock.calls[0][0];

    expect(message.webpush.fcmOptions).toBeUndefined();
  });

  it("should omit the fcm link when the frontend is not served over https", async () => {
    process.env.FRONTEND_URL = "http://localhost:3000";

    await sendByFcm([makeDevice("web-1", "web")], {
      title: "T",
      body: "B",
      link: "/bills",
    });

    const message = sendEachForMulticastMock.mock.calls[0][0];

    expect(message.webpush.fcmOptions).toBeUndefined();
    expect(message.data.url).toBe("/bills");
  });

  it("should not carry the web route in the data sent to native tokens", async () => {
    await sendByFcm([makeDevice("native-1")], {
      title: "T",
      body: "B",
      link: "/bills",
    });

    const message = sendEachForMulticastMock.mock.calls[0][0];

    expect(message.data.url).toBeUndefined();
  });

  it("should not treat a rejected message as a dead token", async () => {
    sendEachForMulticastMock.mockResolvedValue({
      successCount: 0,
      failureCount: 1,
      responses: [
        { success: false, error: { code: "messaging/invalid-argument" } },
      ],
    });

    const result = await sendByFcm([makeDevice("web-1", "web")], {
      title: "T",
      body: "B",
    });

    expect(result[0]).toMatchObject({ success: false, invalidToken: false });
  });

  it("should split web and native devices into separate sends", async () => {
    await sendByFcm(
      [makeDevice("web-1", "web"), makeDevice("native-1")],
      { title: "T", body: "B" },
    );

    expect(sendEachForMulticastMock).toHaveBeenCalledTimes(2);
  });

  it("should flag tokens rejected as not registered", async () => {
    sendEachForMulticastMock.mockResolvedValue({
      successCount: 1,
      failureCount: 1,
      responses: [
        { success: true },
        {
          success: false,
          error: { code: "messaging/registration-token-not-registered" },
        },
      ],
    });

    const result = await sendByFcm(
      [makeDevice("native-1"), makeDevice("native-2")],
      { title: "T", body: "B" },
    );

    expect(result).toEqual([
      expect.objectContaining({ token: "native-1", invalidToken: false }),
      expect.objectContaining({ token: "native-2", invalidToken: true }),
    ]);
  });

  it("should not flag failures caused by other error codes", async () => {
    sendEachForMulticastMock.mockResolvedValue({
      successCount: 0,
      failureCount: 1,
      responses: [
        { success: false, error: { code: "messaging/internal-error" } },
      ],
    });

    const result = await sendByFcm([makeDevice("native-1")], {
      title: "T",
      body: "B",
    });

    expect(result[0]).toMatchObject({ success: false, invalidToken: false });
  });

  it("should split the send into batches of 500 tokens", async () => {
    const devices = Array.from({ length: 1200 }, (_, index) =>
      makeDevice(`token-${index}`),
    );

    await sendByFcm(devices, { title: "T", body: "B" });

    expect(sendEachForMulticastMock).toHaveBeenCalledTimes(3);
    expect(sendEachForMulticastMock.mock.calls[0][0].tokens).toHaveLength(500);
    expect(sendEachForMulticastMock.mock.calls[2][0].tokens).toHaveLength(200);
  });

  it("should map results back to the right batch offset", async () => {
    const devices = Array.from({ length: 600 }, (_, index) =>
      makeDevice(`token-${index}`),
    );

    sendEachForMulticastMock.mockImplementation(async ({ tokens }: any) => ({
      successCount: tokens.length - 1,
      failureCount: 1,
      responses: tokens.map((_: string, index: number) =>
        index === 0
          ? {
              success: false,
              error: { code: "messaging/invalid-registration-token" },
            }
          : { success: true },
      ),
    }));

    const result = await sendByFcm(devices, { title: "T", body: "B" });

    expect(result.filter((r) => r.invalidToken).map((r) => r.token)).toEqual([
      "token-0",
      "token-500",
    ]);
  });

  it("should throw when firebase rejects the send", async () => {
    sendEachForMulticastMock.mockRejectedValue(new Error("Firebase error"));

    await expect(
      sendByFcm([makeDevice("native-1")], { title: "T", body: "B" }),
    ).rejects.toThrow("Firebase error");
  });
});
