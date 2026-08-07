import { MemberModel } from "../../../../src/models/Member";
import * as firebaseIntegration from "../../../../src/integrations/firebase";
import { updatePushTokenService } from "../../../../src/services/members/updatePushToken";

describe("updatePushTokenService (integration)", () => {
  let updateOneSpy: jest.SpyInstance;
  let subscribeSpy: jest.SpyInstance;

  beforeEach(() => {
    updateOneSpy = jest
      .spyOn(MemberModel, "updateOne")
      .mockResolvedValue({ matchedCount: 1 } as any);

    subscribeSpy = jest
      .spyOn(firebaseIntegration, "subscribeTokensToTopic")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should append the token through an aggregation pipeline update", async () => {
    await updatePushTokenService("member-id-123", "new-push-token");

    const [filter, update] = updateOneSpy.mock.calls[0];

    expect(filter).toEqual({ _id: "member-id-123" });
    expect(Array.isArray(update)).toBe(true);
    expect(update[0].$set.lastActiveAt).toBe("$$NOW");
    expect(update[0].$set.deletionWarnedAt).toBeNull();
  });

  it("should dedupe the incoming token before appending it", async () => {
    await updatePushTokenService("member-id-123", "new-push-token");

    const pipeline = updateOneSpy.mock.calls[0][1];
    const concat = pipeline[0].$set.pushTokens.$slice[0].$concatArrays;

    expect(concat[0].$filter.cond).toEqual({
      $ne: ["$$this", "new-push-token"],
    });
    expect(concat[1]).toEqual(["new-push-token"]);
  });

  it("should cap the stored tokens to the last 10", async () => {
    await updatePushTokenService("member-id-123", "new-push-token");

    const pipeline = updateOneSpy.mock.calls[0][1];

    expect(pipeline[0].$set.pushTokens.$slice[1]).toBe(-10);
  });

  it("should subscribe the token to the broadcast topic", async () => {
    await updatePushTokenService("member-id-123", "new-push-token");

    expect(subscribeSpy).toHaveBeenCalledWith(["new-push-token"]);
  });

  it("should not fail the request when the topic subscription fails", async () => {
    subscribeSpy.mockRejectedValue(new Error("FCM down"));

    await expect(
      updatePushTokenService("member-id-123", "token")
    ).resolves.toBeUndefined();
  });

  it("should throw 404 when member is not found", async () => {
    updateOneSpy.mockResolvedValue({ matchedCount: 0 } as any);

    await expect(
      updatePushTokenService("unknown-id", "new-push-token")
    ).rejects.toMatchObject({ statusCode: 404, message: "Member not found" });
  });

  it("should not subscribe to the topic when member is not found", async () => {
    updateOneSpy.mockResolvedValue({ matchedCount: 0 } as any);

    await expect(
      updatePushTokenService("unknown-id", "new-push-token")
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(subscribeSpy).not.toHaveBeenCalled();
  });

  it("should throw when DB update fails", async () => {
    updateOneSpy.mockRejectedValue(new Error("DB error"));

    await expect(
      updatePushTokenService("member-id-123", "token")
    ).rejects.toThrow("DB error");
  });
});
