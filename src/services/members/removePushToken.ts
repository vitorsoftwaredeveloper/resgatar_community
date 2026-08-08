import { removeDeviceService } from "../devices/removeDevice";

export const removePushTokenService = async (
  memberId: string,
  pushToken: string,
): Promise<void> => {
  console.log("IN - removePushTokenService");

  try {
    await removeDeviceService(memberId, pushToken);
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - removePushTokenService");
  }
};
