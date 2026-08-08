import { Schema } from "mongoose";
import { createInstanceMongoose } from "../repositories/mongoose";

const DeviceSchema = new Schema(
  {
    memberId: { type: String, ref: "members", required: true, index: true },
    token: { type: String, required: true, unique: true },
    platform: {
      type: String,
      enum: ["android", "ios", "web", "desktop"],
      default: null,
    },
    client: {
      type: String,
      enum: ["web", "native"],
      required: true,
      default: "native",
    },
    installed: { type: Boolean, required: true, default: false },
    lastUsedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true },
);

export const DeviceModel = createInstanceMongoose("devices", DeviceSchema);
