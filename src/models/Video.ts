import mongoose, { Schema } from "mongoose";
import { createInstanceMongoose } from "../repositories/mongoose";

const VideoSchema = new Schema(
  {
    _id: { type: String, required: true },
    memberId: { type: String, required: true, index: true },
    url: { type: String, required: true },
    videoId: { type: String, required: true },
    title: { type: String, default: null },
  },
  { timestamps: true }
);

export const VideoModel = createInstanceMongoose("videos", VideoSchema);
