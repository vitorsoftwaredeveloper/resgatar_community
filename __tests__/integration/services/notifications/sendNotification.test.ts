import { DeviceModel } from "../../../../src/models/Device";
import * as fcmChannel from "../../../../src/services/notifications/channels/fcmChannel";
import {
  sendNotification,
  sendNotificationToAllMembers,
} from "../../../../src/services/notifications/sendNotification";

const devices = [
  { _id: "d1", memberId: "m1", token: "token-1", client: "web" },
  { _id: "d2", memberId: "m2", token: "token-2", client: "native" },
];

describe("sendNotification (integration)", () => {
  let findSpy: jest.SpyInstance;
  let deleteManySpy: jest.SpyInstance;
  let sendByFcmSpy: jest.SpyInstance;

  beforeEach(() => {
    findSpy = jest.spyOn(DeviceModel, "find").mockResolvedValue(devices as any);

    deleteManySpy = jest
      .spyOn(DeviceModel, "deleteMany")
      .mockResolvedValue({} as any);

    sendByFcmSpy = jest.spyOn(fcmChannel, "sendByFcm").mockResolvedValue([
      { token: "token-1", success: true, invalidToken: false },
      { token: "token-2", success: true, invalidToken: false },
    ]);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should resolve the devices of the given members", async () => {
    await sendNotification(["m1", "m2"], { title: "T", body: "B" });

    expect(findSpy).toHaveBeenCalledWith({ memberId: { $in: ["m1", "m2"] } });
    expect(sendByFcmSpy).toHaveBeenCalledWith(devices, {
      title: "T",
      body: "B",
    });
  });

  it("should dedupe member ids before querying", async () => {
    await sendNotification(["m1", "m1", "m2"], { title: "T", body: "B" });

    expect(findSpy).toHaveBeenCalledWith({ memberId: { $in: ["m1", "m2"] } });
  });

  it("should do nothing when the member list is empty", async () => {
    await sendNotification([], { title: "T", body: "B" });

    expect(findSpy).not.toHaveBeenCalled();
    expect(sendByFcmSpy).not.toHaveBeenCalled();
  });

  it("should not call the channel when no device is registered", async () => {
    findSpy.mockResolvedValue([]);

    await sendNotification(["m1"], { title: "T", body: "B" });

    expect(sendByFcmSpy).not.toHaveBeenCalled();
  });

  it("should prune devices whose token is no longer registered", async () => {
    sendByFcmSpy.mockResolvedValue([
      { token: "token-1", success: false, invalidToken: true },
      { token: "token-2", success: true, invalidToken: false },
    ]);

    await sendNotification(["m1", "m2"], { title: "T", body: "B" });

    expect(deleteManySpy).toHaveBeenCalledWith({
      token: { $in: ["token-1"] },
    });
  });

  it("should not prune anything when every token is valid", async () => {
    await sendNotification(["m1"], { title: "T", body: "B" });

    expect(deleteManySpy).not.toHaveBeenCalled();
  });

  it("should propagate channel errors", async () => {
    sendByFcmSpy.mockRejectedValue(new Error("Firebase error"));

    await expect(
      sendNotification(["m1"], { title: "T", body: "B" }),
    ).rejects.toThrow("Firebase error");
  });
});

describe("sendNotificationToAllMembers (integration)", () => {
  let findSpy: jest.SpyInstance;
  let sendByFcmSpy: jest.SpyInstance;

  beforeEach(() => {
    findSpy = jest.spyOn(DeviceModel, "find").mockResolvedValue(devices as any);

    jest.spyOn(DeviceModel, "deleteMany").mockResolvedValue({} as any);

    sendByFcmSpy = jest.spyOn(fcmChannel, "sendByFcm").mockResolvedValue([
      { token: "token-1", success: true, invalidToken: false },
      { token: "token-2", success: true, invalidToken: false },
    ]);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should send to every registered device", async () => {
    await sendNotificationToAllMembers({ title: "T", body: "B" });

    expect(findSpy).toHaveBeenCalledWith({});
    expect(sendByFcmSpy).toHaveBeenCalledWith(devices, {
      title: "T",
      body: "B",
    });
  });

  it("should not call the channel when there is no device at all", async () => {
    findSpy.mockResolvedValue([]);

    await sendNotificationToAllMembers({ title: "T", body: "B" });

    expect(sendByFcmSpy).not.toHaveBeenCalled();
  });
});
