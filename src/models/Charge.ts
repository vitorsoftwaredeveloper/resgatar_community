import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { createInstanceMongoose } from "../repositories/mongoose";

const PointOfInteractionSchema = new Schema(
  {
    transactionData: {
      qrCode: { type: String },
      qrCodeBase64: { type: String },
      ticketUrl: { type: String },
    },
  },
  { _id: false }
);

const ChargeSchema = new Schema(
  {
    _id: { type: String, unique: true, required: true },
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
    dateApproved: { type: Date, required: true },
    transactionDetails: {
      netReceivedAmount: { type: Number, required: true },
    },
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
        number: { type: String, required: true },
      },
    },
  },
  { timestamps: true }
);
export const ChargeModel = createInstanceMongoose("charges", ChargeSchema);
