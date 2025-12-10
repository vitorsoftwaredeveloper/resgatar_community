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

const PaymentSchema = new Schema(
  {
    datePayment: { type: Date },
    amount: { type: Number, min: 1 },
  },
  { _id: false }
);

const MemberSchema = new Schema(
  {
    _id: { type: String, default: () => uuidv4() },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    status: { type: String, enum: ["active", "defaulter"], default: "active" },
    phoneNumber: { type: String, trim: true },
    name: { type: String, trim: true },
    bio: { type: String, trim: true },
    age: { type: Number, min: 1 },
    address: { type: AddressSchema },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    lastLoginAt: { type: Date },
    contributions: { type: Map, of: Boolean, default: {} },
    paymentInfo: { type: PaymentSchema },
  },
  { timestamps: true }
);

export const MemberModel = mongoose.model("members", MemberSchema);
