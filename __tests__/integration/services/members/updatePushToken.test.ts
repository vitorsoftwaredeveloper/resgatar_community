import { MemberModel } from "../../../../src/models/Member";
import { updatePushTokenService } from "../../../../src/services/members/updatePushToken";

describe("updatePushTokenService (integration)", () => {
  let updateOneSpy: jest.SpyInstance;

  beforeEach(() => {
    updateOneSpy = jest
      .spyOn(MemberModel, "updateOne")
      .mockResolvedValue({ matchedCount: 1 } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should update pushToken for the member", async () => {
    await updatePushTokenService("member-id-123", "new-push-token");

    expect(updateOneSpy).toHaveBeenCalledWith(
      { _id: "member-id-123" },
      {
        $set: {
          pushToken: "new-push-token",
          lastActiveAt: expect.any(Date),
          deletionWarnedAt: null,
        },
      }
    );
  });

  it("should throw 404 when member is not found", async () => {
    updateOneSpy.mockResolvedValue({ matchedCount: 0 } as any);

    await expect(
      updatePushTokenService("unknown-id", "new-push-token")
    ).rejects.toMatchObject({ statusCode: 404, message: "Member not found" });
  });

  it("should throw when DB update fails", async () => {
    updateOneSpy.mockRejectedValue(new Error("DB error"));

    await expect(
      updatePushTokenService("member-id-123", "token")
    ).rejects.toThrow("DB error");
  });

  it("should not modify other fields when updating pushToken", async () => {
    await updatePushTokenService("member-id-123", "token-abc");

    expect(updateOneSpy).toHaveBeenCalledWith(
      expect.any(Object),
      {
        $set: {
          pushToken: "token-abc",
          lastActiveAt: expect.any(Date),
          deletionWarnedAt: null,
        },
      }
    );
  });
});
