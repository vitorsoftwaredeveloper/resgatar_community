import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const AddressSchema = new Schema(
  {
    street: { type: String },
    number: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
  },
  { _id: false }
);

const MemberSchema = new Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: { type: String, trim: true },
    bio: { type: String, trim: true },
    age: { type: Number, min: 0 },
    address: { type: AddressSchema },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    lastLoginAt: { type: Date },
    contributions: { type: Map, of: Boolean, default: {} },
  },
  { timestamps: true }
);

export const MemberModel = mongoose.model("members", MemberSchema);
