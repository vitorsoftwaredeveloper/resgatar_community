import * as firebaseIntegration from "../../../../src/integrations/firebase";
import { execute } from "../../../../src/services/agents/dailyLiturgy";

describe("dailyLiturgy agent (integration)", () => {
  let sendPushSpy: jest.SpyInstance;

  beforeEach(() => {
    sendPushSpy = jest
      .spyOn(firebaseIntegration, "sendPushNotificationToAll")
      .mockResolvedValue(undefined as any);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should send push notification to all members", async () => {
    await execute();

    expect(sendPushSpy).toHaveBeenCalledTimes(1);
    expect(sendPushSpy).toHaveBeenCalledWith(
      "Liturgia Diária",
      expect.any(String),
    );
  });

  it("should not throw when push notification fails", async () => {
    sendPushSpy.mockRejectedValue(new Error("Firebase unavailable"));

    await expect(execute()).resolves.not.toThrow();
  });
});
