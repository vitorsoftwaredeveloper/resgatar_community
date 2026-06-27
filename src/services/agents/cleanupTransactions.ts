import { TRANSACTION_STATUS } from "../../constants/charges";
import { ChargeModel } from "../../models/Charge";
import { DonationModel } from "../../models/Donation";

// Faxina diária dos ledgers de pagamento. Charges e donations que ficaram
// PENDING (PIX criado e nunca pago) ou REJECTED não viram caixa e só carregam
// peso morto — principalmente o qrCodeBase64. Remover ambos mantém o banco
// (free tier) enxuto. Status liquidados (approved/refunded/charged_back) são
// preservados para auditoria e para as agregações.
const DISPOSABLE_STATUSES = [
  TRANSACTION_STATUS.PENDING,
  TRANSACTION_STATUS.REJECTED,
];

export const execute = async () => {
  try {
    console.log("IN - cleanupTransactions");

    const [charges, donations] = await Promise.all([
      ChargeModel.deleteMany({ status: { $in: DISPOSABLE_STATUSES } }),
      DonationModel.deleteMany({ status: { $in: DISPOSABLE_STATUSES } }),
    ]);

    console.log("Deleted charges:", charges.deletedCount);
    console.log("Deleted donations:", donations.deletedCount);
  } catch (error) {
    console.error("Error cleaning up transactions", error);
  } finally {
    console.log("OUT - cleanupTransactions");
  }
};
