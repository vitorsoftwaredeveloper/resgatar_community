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
    _id: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phoneNumber: { type: String, trim: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    bio: { type: String, trim: true },
    age: { type: Number, min: 1 },
    address: { type: AddressSchema },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    paymentInfo: { type: PaymentInfoSchema },
    identification: {
      type: {
        type: String,
        enum: ["CPF", "CNPJ"],
        required: true,
      },
      number: { type: String, required: true },
    },
    status: { type: String, enum: ["active", "defaulter"], default: "active" },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);
export const MemberModel = createInstanceMongoose("members", MemberSchema);
