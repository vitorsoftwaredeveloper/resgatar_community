import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { createInstanceMongoose } from "../repositories/mongoose";

const NotiicationSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, trim: true, required: true },
  },
  { timestamps: true }
);
export const NotificationModel = createInstanceMongoose(
  "notifications",
  NotiicationSchema
);
