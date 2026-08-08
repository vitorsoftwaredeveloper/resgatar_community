import * as registerDeviceModule from "../../../../src/services/devices/registerDevice";
import { updatePushTokenService } from "../../../../src/services/members/updatePushToken";

describe("updatePushTokenService (integration)", () => {
  let registerDeviceSpy: jest.SpyInstance;

  beforeEach(() => {
    registerDeviceSpy = jest
      .spyOn(registerDeviceModule, "registerDeviceService")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should register the token as a native device", async () => {
    await updatePushTokenService("member-id-123", "new-push-token");

    expect(registerDeviceSpy).toHaveBeenCalledWith("member-id-123", {
      token: "new-push-token",
      installed: true,
      client: "native",
    });
  });

  it("should propagate the 404 raised when the member does not exist", async () => {
    registerDeviceSpy.mockRejectedValue({
      statusCode: 404,
      message: "Member not found",
    });

    await expect(
      updatePushTokenService("unknown-id", "new-push-token"),
    ).rejects.toMatchObject({ statusCode: 404, message: "Member not found" });
  });

  it("should throw when the device write fails", async () => {
    registerDeviceSpy.mockRejectedValue(new Error("DB error"));

    await expect(
      updatePushTokenService("member-id-123", "token"),
    ).rejects.toThrow("DB error");
  });
});
