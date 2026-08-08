import * as dbModule from "../../../../src/db";
import * as notificationEngine from "../../../../src/services/notifications/sendNotification";
import { execute } from "../../../../src/services/agents/dailyLiturgy";

describe("dailyLiturgy agent (integration)", () => {
  let broadcastSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(dbModule, "db").mockResolvedValue(undefined as any);

    broadcastSpy = jest
      .spyOn(notificationEngine, "sendNotificationToAllMembers")
      .mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should broadcast to every registered device", async () => {
    await execute();

    expect(broadcastSpy).toHaveBeenCalledTimes(1);
    expect(broadcastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Liturgia Diária" }),
    );
  });

  it("should deep link to the readings screen", async () => {
    await execute();

    expect(broadcastSpy.mock.calls[0][0].link).toBe("/readings");
  });

  it("should not throw when the broadcast fails", async () => {
    broadcastSpy.mockRejectedValue(new Error("Firebase unavailable"));

    await expect(execute()).resolves.not.toThrow();
  });
});
