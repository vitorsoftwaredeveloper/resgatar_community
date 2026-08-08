import { DeviceModel } from "../../models/Device";
import { IDevice, IUpsertDeviceInput } from "../../types/devices";
import { MemberModel } from "../../models/Member";
import { STATUS_CODE } from "../../constants";

const MAX_DEVICES_PER_MEMBER = 10;

const capDevicesPerMember = async (memberId: string): Promise<void> => {
  const devices = (await DeviceModel.find(
    { memberId },
    { token: 1, lastUsedAt: 1 },
    { sort: { lastUsedAt: -1 } },
  )) as unknown as IDevice[];

  const stale = devices
    .slice(MAX_DEVICES_PER_MEMBER)
    .map((device) => device.token);

  if (stale.length === 0) return;

  await DeviceModel.deleteMany({ token: { $in: stale } });
};

export const registerDeviceService = async (
  memberId: string,
  input: IUpsertDeviceInput,
): Promise<void> => {
  console.log("IN - registerDeviceService", { client: input.client });

  try {
    const member = await MemberModel.findById(memberId, { _id: 1 });

    if (!member) {
      throw { statusCode: STATUS_CODE.NOT_FOUND, message: "Member not found" };
    }

    await DeviceModel.updateOne(
      { token: input.token },
      {
        $set: {
          memberId,
          token: input.token,
          platform: input.platform ?? null,
          client: input.client,
          installed: input.installed ?? false,
          lastUsedAt: new Date(),
        },
      },
      { upsert: true },
    );

    await MemberModel.updateOne(
      { _id: memberId },
      { $set: { lastActiveAt: new Date(), deletionWarnedAt: null } },
    );

    await capDevicesPerMember(memberId);
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - registerDeviceService");
  }
};
