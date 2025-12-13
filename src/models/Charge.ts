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
    _id: { type: String, default: () => uuidv4() },
    referenceId: { type: String, required: true, unique: true },
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
    payment_type_id: {
      type: String,
      required: true,
      enum: ["bank_transfer", "ticket", "credit_card"],
    },
    currencyId: { type: String, required: true },
    dateCreated: { type: Date, required: true },
    dateOfExpiration: { type: Date, required: true },
    date_approved: { type: Date, required: true },
    transaction_details: {
      netReceivedAmount: { type: Number, required: true },
    },
    feeDetails: { type: String, required: true },
    pointOfInteraction: { type: PointOfInteractionSchema },
    externalReference: { type: String, required: true },
  },
  { timestamps: true }
);
export const ChargeModel = createInstanceMongoose("charges", ChargeSchema);
