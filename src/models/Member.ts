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
    complement: { type: String },
  },
  { _id: false }
);

const PaymentInfoSchema = new Schema(
  { datePayment: { type: Number }, amount: { type: String, min: 1 } },
  { _id: false }
);

const IdentificationSchema = new Schema(
  {
    type: { type: String, enum: ["CPF", "CNPJ"], required: true },
    numberType: { type: String, required: true },
  },
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
    phoneNumber: { type: String, trim: true, required: true },
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, required: true },
    bio: { type: String, trim: true, default: "" },
    dateOfBirth: { type: String, required: true },
    address: { type: AddressSchema },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    paymentInfo: { type: PaymentInfoSchema, required: true },
    identification: { type: IdentificationSchema, required: true },
    status: { type: String, enum: ["active", "defaulter"], default: "active" },
    pushToken: { type: String, default: null },
  },
  { timestamps: true }
);
export const MemberModel = createInstanceMongoose("members", MemberSchema);
