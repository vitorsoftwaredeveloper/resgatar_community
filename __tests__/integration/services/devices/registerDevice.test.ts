import { DeviceModel } from "../../../../src/models/Device";
import { MemberModel } from "../../../../src/models/Member";
import { registerDeviceService } from "../../../../src/services/devices/registerDevice";

describe("registerDeviceService (integration)", () => {
  let findByIdSpy: jest.SpyInstance;
  let deviceUpdateOneSpy: jest.SpyInstance;
  let deviceFindSpy: jest.SpyInstance;
  let deviceDeleteManySpy: jest.SpyInstance;
  let memberUpdateOneSpy: jest.SpyInstance;

  beforeEach(() => {
    findByIdSpy = jest
      .spyOn(MemberModel, "findById")
      .mockResolvedValue({ _id: "member-1" } as any);

    deviceUpdateOneSpy = jest
      .spyOn(DeviceModel, "updateOne")
      .mockResolvedValue({} as any);

    deviceFindSpy = jest.spyOn(DeviceModel, "find").mockResolvedValue([] as any);

    deviceDeleteManySpy = jest
      .spyOn(DeviceModel, "deleteMany")
      .mockResolvedValue({} as any);

    memberUpdateOneSpy = jest
      .spyOn(MemberModel, "updateOne")
      .mockResolvedValue({} as any);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should upsert the device by token", async () => {
    await registerDeviceService("member-1", {
      token: "fcm-token",
      platform: "web",
      installed: true,
      client: "web",
    });

    const [filter, update, options] = deviceUpdateOneSpy.mock.calls[0];

    expect(filter).toEqual({ token: "fcm-token" });
    expect(options).toEqual({ upsert: true });
    expect(update.$set).toMatchObject({
      memberId: "member-1",
      token: "fcm-token",
      platform: "web",
      client: "web",
      installed: true,
    });
  });

  it("should default installed to false and platform to null", async () => {
    await registerDeviceService("member-1", {
      token: "fcm-token",
      client: "native",
    });

    const update = deviceUpdateOneSpy.mock.calls[0][1];

    expect(update.$set.installed).toBe(false);
    expect(update.$set.platform).toBeNull();
  });

  it("should reassign a token already owned by another member", async () => {
    await registerDeviceService("member-2", {
      token: "shared-token",
      client: "web",
    });

    const [filter, update] = deviceUpdateOneSpy.mock.calls[0];

    expect(filter).toEqual({ token: "shared-token" });
    expect(update.$set.memberId).toBe("member-2");
  });

  it("should refresh the member activity window", async () => {
    await registerDeviceService("member-1", {
      token: "fcm-token",
      client: "web",
    });

    const [filter, update] = memberUpdateOneSpy.mock.calls[0];

    expect(filter).toEqual({ _id: "member-1" });
    expect(update.$set.deletionWarnedAt).toBeNull();
    expect(update.$set.lastActiveAt).toBeInstanceOf(Date);
  });

  it("should drop the oldest devices beyond the cap of 10", async () => {
    deviceFindSpy.mockResolvedValue(
      Array.from({ length: 12 }, (_, index) => ({
        token: `token-${index}`,
        lastUsedAt: new Date(),
      })) as any,
    );

    await registerDeviceService("member-1", {
      token: "token-0",
      client: "web",
    });

    expect(deviceDeleteManySpy).toHaveBeenCalledWith({
      token: { $in: ["token-10", "token-11"] },
    });
  });

  it("should not delete anything while under the cap", async () => {
    deviceFindSpy.mockResolvedValue([
      { token: "token-0", lastUsedAt: new Date() },
    ] as any);

    await registerDeviceService("member-1", {
      token: "token-0",
      client: "web",
    });

    expect(deviceDeleteManySpy).not.toHaveBeenCalled();
  });

  it("should throw 404 when the member does not exist", async () => {
    findByIdSpy.mockResolvedValue(null);

    await expect(
      registerDeviceService("ghost", { token: "fcm-token", client: "web" }),
    ).rejects.toMatchObject({ statusCode: 404, message: "Member not found" });

    expect(deviceUpdateOneSpy).not.toHaveBeenCalled();
  });

  it("should propagate database errors", async () => {
    deviceUpdateOneSpy.mockRejectedValue(new Error("DB error"));

    await expect(
      registerDeviceService("member-1", { token: "fcm-token", client: "web" }),
    ).rejects.toThrow("DB error");
  });
});
