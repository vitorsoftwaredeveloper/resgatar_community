export type DevicePlatform = "android" | "ios" | "web" | "desktop";

export type DeviceClient = "web" | "native";

export interface IDevice {
  _id: string;
  memberId: string;
  token: string;
  platform?: DevicePlatform | null;
  client: DeviceClient;
  installed: boolean;
  lastUsedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRegisterDevicePayload {
  token: string;
  platform: DevicePlatform;
  installed?: boolean;
}

export interface IUpsertDeviceInput {
  token: string;
  platform?: DevicePlatform | null;
  installed?: boolean;
  client: DeviceClient;
}
