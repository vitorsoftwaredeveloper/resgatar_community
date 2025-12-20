import { Schema } from "mongoose";
import { createInstanceMongoose } from "../repositories/mongoose";

const ContributionSchema = new Schema(
  {
    memberId: { type: String, required: true },
    year: { type: Number, required: true },
    months: {
      january: { type: Boolean },
      february: { type: Boolean },
      march: { type: Boolean },
      april: { type: Boolean },
      may: { type: Boolean },
      june: { type: Boolean },
      july: { type: Boolean },
      august: { type: Boolean },
      september: { type: Boolean },
      october: { type: Boolean },
      november: { type: Boolean },
      december: { type: Boolean },
    },
  },
  { timestamps: true }
);
export const ContributionModel = createInstanceMongoose(
  "contributions",
  ContributionSchema
);
