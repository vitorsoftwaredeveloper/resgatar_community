import { DeviceModel } from "../../models/Device";

export const removeDeviceService = async (
  memberId: string,
  token: string,
): Promise<void> => {
  console.log("IN - removeDeviceService");

  try {
    await DeviceModel.deleteOne({ token, memberId });
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - removeDeviceService");
  }
};
