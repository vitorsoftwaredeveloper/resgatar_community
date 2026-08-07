import { MemberModel } from "../../../../src/models/Member";
import * as firebaseIntegration from "../../../../src/integrations/firebase";
import { clearInvalidPushTokens } from "../../../../src/services/notifications/pushTokens";

describe("clearInvalidPushTokens (integration)", () => {
  let updateManySpy: jest.SpyInstance;
  let unsubscribeSpy: jest.SpyInstance;

  beforeEach(() => {
    updateManySpy = jest
      .spyOn(MemberModel, "updateMany")
      .mockResolvedValue({} as any);

    unsubscribeSpy = jest
      .spyOn(firebaseIntegration, "unsubscribeTokensFromTopic")
      .mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should pull the invalid tokens from every member holding them", async () => {
    await clearInvalidPushTokens(["token-1", "token-2"]);

    expect(updateManySpy).toHaveBeenCalledWith(
      { pushTokens: { $in: ["token-1", "token-2"] } },
      { $pull: { pushTokens: { $in: ["token-1", "token-2"] } } },
    );
  });

  it("should unsubscribe the invalid tokens from the broadcast topic", async () => {
    await clearInvalidPushTokens(["token-1"]);

    expect(unsubscribeSpy).toHaveBeenCalledWith(["token-1"]);
  });

  it("should do nothing when there are no invalid tokens", async () => {
    await clearInvalidPushTokens([]);

    expect(updateManySpy).not.toHaveBeenCalled();
    expect(unsubscribeSpy).not.toHaveBeenCalled();
  });

  it("should not throw when the topic unsubscription fails", async () => {
    unsubscribeSpy.mockRejectedValue(new Error("FCM down"));

    await expect(clearInvalidPushTokens(["token-1"])).resolves.toBeUndefined();
    expect(updateManySpy).toHaveBeenCalled();
  });

  it("should propagate database errors", async () => {
    updateManySpy.mockRejectedValue(new Error("DB error"));

    await expect(clearInvalidPushTokens(["token-1"])).rejects.toThrow("DB error");
  });
});
