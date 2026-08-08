import { DeviceModel } from "../../../../src/models/Device";
import { removeDeviceService } from "../../../../src/services/devices/removeDevice";

describe("removeDeviceService (integration)", () => {
  let deleteOneSpy: jest.SpyInstance;

  beforeEach(() => {
    deleteOneSpy = jest
      .spyOn(DeviceModel, "deleteOne")
      .mockResolvedValue({ deletedCount: 1 } as any);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should delete only the device owned by the member", async () => {
    await removeDeviceService("member-1", "fcm-token");

    expect(deleteOneSpy).toHaveBeenCalledWith({
      token: "fcm-token",
      memberId: "member-1",
    });
  });

  it("should resolve silently when the token belongs to someone else", async () => {
    deleteOneSpy.mockResolvedValue({ deletedCount: 0 } as any);

    await expect(
      removeDeviceService("member-1", "other-token"),
    ).resolves.toBeUndefined();
  });

  it("should propagate database errors", async () => {
    deleteOneSpy.mockRejectedValue(new Error("DB error"));

    await expect(
      removeDeviceService("member-1", "fcm-token"),
    ).rejects.toThrow("DB error");
  });
});
