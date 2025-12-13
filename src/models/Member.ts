import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { createInstanceMongoose } from "../repositories/mongoose";

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

const PaymentInfoSchema = new Schema(
  { datePayment: { type: Number }, amount: { type: Number, min: 1 } },
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
    role: { type: String, enum: ["admin", "user"], default: "user" },
    lastLoginAt: { type: Date },
    paymentInfo: { type: PaymentInfoSchema },
  },
  { timestamps: true }
);
export const MemberModel = createInstanceMongoose("members", MemberSchema);
