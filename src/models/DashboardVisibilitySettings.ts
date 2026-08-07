import { Schema } from "mongoose";
import { createInstanceMongoose } from "../repositories/mongoose";

const DashboardVisibilitySettingsSchema = new Schema(
  {
    _id: { type: String },
    notices: { type: Boolean, required: true, default: false },
    communityGoal: { type: Boolean, required: true, default: false },
    birthdays: { type: Boolean, required: true, default: false },
    banners: { type: Boolean, required: true, default: true },
    videos: { type: Boolean, required: true, default: true },
    adminId: { type: String, required: true },
  },
  { timestamps: true, _id: false },
);

export const DashboardVisibilitySettingsModel = createInstanceMongoose(
  "dashboardvisibilitysettings",
  DashboardVisibilitySettingsSchema,
);
