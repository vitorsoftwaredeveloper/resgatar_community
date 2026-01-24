import { Schema } from "mongoose";
import { createInstanceMongoose } from "../repositories/mongoose";

const NotiicationSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      trim: true,
      required: true,
      enum: ["info", "alert", "warning"],
    },
  },
  { timestamps: true },
);

NotiicationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 },
);

export const NotificationModel = createInstanceMongoose(
  "notifications",
  NotiicationSchema,
);
