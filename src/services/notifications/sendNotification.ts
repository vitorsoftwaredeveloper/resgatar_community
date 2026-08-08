import { DeviceModel } from "../../models/Device";
import { IDevice } from "../../types/devices";
import { INotificationPayload } from "../../types/notification";
import { sendByFcm } from "./channels/fcmChannel";

const pruneDeadTokens = async (tokens: string[]): Promise<void> => {
  if (tokens.length === 0) return;

  await DeviceModel.deleteMany({ token: { $in: tokens } });

  console.log("devices removed - tokens not registered", {
    count: tokens.length,
  });
};

const dispatch = async (
  devices: IDevice[],
  payload: INotificationPayload,
): Promise<void> => {
  if (devices.length === 0) {
    console.log("notification without destination - no device registered");
    return;
  }

  const results = await sendByFcm(devices, payload);

  await pruneDeadTokens(
    results.filter((result) => result.invalidToken).map((result) => result.token),
  );

  const failures = results.filter((result) => !result.success);

  console.log("notification sent", {
    destinations: devices.length,
    success: results.length - failures.length,
    failures: failures.length,
  });

  failures.forEach((failure) =>
    console.log("notification failure", {
      invalidToken: failure.invalidToken,
      error: failure.error,
    }),
  );
};

export const sendNotification = async (
  memberIds: string[],
  payload: INotificationPayload,
): Promise<void> => {
  console.log("IN - sendNotification", { members: memberIds.length });

  try {
    const uniqueIds = [...new Set(memberIds.filter(Boolean).map(String))];
    if (uniqueIds.length === 0) return;

    const devices = (await DeviceModel.find({
      memberId: { $in: uniqueIds },
    })) as unknown as IDevice[];

    await dispatch(devices, payload);
  } finally {
    console.log("OUT - sendNotification");
  }
};

export const sendNotificationToAllMembers = async (
  payload: INotificationPayload,
): Promise<void> => {
  console.log("IN - sendNotificationToAllMembers");

  try {
    const devices = (await DeviceModel.find({})) as unknown as IDevice[];

    await dispatch(devices, payload);
  } finally {
    console.log("OUT - sendNotificationToAllMembers");
  }
};
