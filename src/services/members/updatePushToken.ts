import { registerDeviceService } from "../devices/registerDevice";

export const updatePushTokenService = async (
  memberId: string,
  pushToken: string,
): Promise<void> => {
  console.log("IN - updatePushTokenService");

  try {
    await registerDeviceService(memberId, {
      token: pushToken,
      installed: true,
      client: "native",
    });
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - updatePushTokenService");
  }
};
