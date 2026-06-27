import { Schema } from "mongoose";
import { createInstanceMongoose } from "../repositories/mongoose";
import { TRANSACTION_STATUS } from "../constants/charges";

// Doação avulsa (contribuição fora da mensalidade fixa). Diferente da Charge, o
// valor é arbitrário e ela NÃO entra na grade de Contribution — é um ledger
// próprio, somado ao balanço como linha separada. Nasce vinculada ao membro
// logado (memberId), mas pode registrar o nome de quem realmente doou.
const DonationSchema = new Schema(
  {
    // id do pagamento no MercadoPago (PIX) ou um id sintético (dinheiro).
    transactionId: { type: String, required: true, unique: true },
    memberId: { type: String, required: true, index: true },
    donorName: { type: String }, // nome do doador real; vazio = o próprio membro
    amount: { type: String, required: true }, // "xx,xx"
    paymentMethodId: {
      type: String,
      required: true,
      enum: ["pix", "cash"],
    },
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
    statusDetail: { type: String },
    currencyId: { type: String },
    dateCreated: { type: Date },
    dateOfExpiration: { type: Date },
    dateApproved: { type: Date, nullable: true },
    // 0-indexado (0 = janeiro), alinhado ao Expense e ao balanço.
    referenceMonth: { type: Number, required: true, min: 0, max: 11 },
    referenceYear: { type: Number, required: true },
    transactionData: {
      qrCode: { type: String },
      qrCodeBase64: { type: String },
      ticketUrl: { type: String },
    },
  },
  { timestamps: true },
);

// Consulta do balanço: doações aprovadas do ano.
DonationSchema.index({ referenceYear: 1, status: 1 });

export const DonationModel = createInstanceMongoose("donations", DonationSchema);
