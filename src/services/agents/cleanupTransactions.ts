import {
  RETURNED_TRANSACTION_STATUSES,
  TRANSACTION_STATUS,
} from "../../constants/charges";
import { ChargeModel } from "../../models/Charge";
import { DonationModel } from "../../models/Donation";

// Faxina diária dos ledgers de pagamento. Charges e donations que ficaram
// PENDING (PIX criado e nunca pago) ou REJECTED não viram caixa e só carregam
// peso morto — principalmente o qrCodeBase64. Remover ambos mantém o banco
// (free tier) enxuto.
const DISPOSABLE_STATUSES = [
  TRANSACTION_STATUS.PENDING,
  TRANSACTION_STATUS.REJECTED,
];

// A charge devolvida (refunded/charged_back) é preservada: ela é a contrapartida
// do mês revertido na grade de Contribution. Já a doação devolvida não tem
// nenhuma outra estrutura para sustentar — o webhook a apaga na hora, e esta
// varredura é a rede de segurança para o webhook que se perdeu e para os
// registros devolvidos que já estão no banco.
const DISPOSABLE_DONATION_STATUSES = [
  ...DISPOSABLE_STATUSES,
  ...RETURNED_TRANSACTION_STATUSES,
];

export const execute = async () => {
  try {
    console.log("IN - cleanupTransactions");

    const [charges, donations] = await Promise.all([
      ChargeModel.deleteMany({ status: { $in: DISPOSABLE_STATUSES } }),
      DonationModel.deleteMany({
        status: { $in: DISPOSABLE_DONATION_STATUSES },
      }),
    ]);

    console.log("Deleted charges:", charges.deletedCount);
    console.log("Deleted donations:", donations.deletedCount);
  } catch (error) {
    console.error("Error cleaning up transactions", error);
  } finally {
    console.log("OUT - cleanupTransactions");
  }
};
