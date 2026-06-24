import { Schema } from "mongoose";
import { createInstanceMongoose } from "../repositories/mongoose";

const MonthSchema = new Schema(
  {
    paid: { type: Boolean, default: false },
    value: { type: String },
    paidAt: { type: Date },
    paymentMethod: { type: String, enum: ["pix", "cash"] },
  },
  { _id: false }
);

const ContributionSchema = new Schema(
  {
    memberId: {
      type: String,
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    months: {
      january: { type: MonthSchema },
      february: { type: MonthSchema },
      march: { type: MonthSchema },
      april: { type: MonthSchema },
      may: { type: MonthSchema },
      june: { type: MonthSchema },
      july: { type: MonthSchema },
      august: { type: MonthSchema },
      september: { type: MonthSchema },
      october: { type: MonthSchema },
      november: { type: MonthSchema },
      december: { type: MonthSchema },
    },
  },
  { timestamps: true }
);

export const ContributionModel = createInstanceMongoose(
  "contributions",
  ContributionSchema
);

ContributionSchema.index({ memberId: 1, year: 1 }, { unique: true });
