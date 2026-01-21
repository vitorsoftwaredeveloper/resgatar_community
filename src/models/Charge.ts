import mongoose, { Schema } from "mongoose";
import { createInstanceMongoose } from "../repositories/mongoose";
import { TRANSACTION_STATUS } from "../constants/charges";

const ChargeSchema = new Schema(
  {
    transactionId: { type: String, required: true },
    memberId: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: [
        TRANSACTION_STATUS.PENDING,
        TRANSACTION_STATUS.APPROVED,
        TRANSACTION_STATUS.REJECTED,
        TRANSACTION_STATUS.CANCELLED,
        TRANSACTION_STATUS.REFUNDED,
        TRANSACTION_STATUS.CHARGED_BACK,
      ],
    },
    statusDetail: { type: String, required: true },
    transactionAmount: { type: String, required: true },
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
    referenceMonth: { type: Number, required: true },
  },
  { timestamps: true },
);
export const ChargeModel = createInstanceMongoose("charges", ChargeSchema);
