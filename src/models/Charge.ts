import mongoose, { Schema } from "mongoose";
import { createInstanceMongoose } from "../repositories/mongoose";

const ChargeSchema = new Schema(
  {
    transactionId: { type: String, required: true },
    memberId: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected", "cancelled"],
    },
    statusDetail: { type: String, required: true },
    transactionAmount: { type: Number, required: true },
    paymentMethodId: {
      type: String,
      required: true,
      enum: ["pix", "boleto", "credit_card"],
    },
    currencyId: { type: String, required: true },
    dateCreated: { type: Date, required: true },
    dateOfExpiration: { type: Date, required: true },
    dateApproved: { type: Date, nullable: true },
    payer: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      identification: {
        type: {
          type: String,
          enum: ["CPF", "CNPJ"],
          required: true,
        },
        numberType: { type: String, required: true },
      },
    },
    transactionData: {
      qrCode: { type: String },
      qrCodeBase64: { type: String },
      ticketUrl: { type: String },
    },
  },
  { timestamps: true }
);
export const ChargeModel = createInstanceMongoose("charges", ChargeSchema);
