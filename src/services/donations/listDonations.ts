import { DonationModel } from "../../models/Donation";
import { TRANSACTION_STATUS } from "../../constants/charges";
import { verifyAdmin } from "../helper";

// Lista as doações de um ano para o painel de admin (transparência/auditoria).
// Só doações APROVADAS entram: pendentes (PIX ainda não pago) e devolvidas
// (refunded/charged_back) não representam dinheiro em caixa, então ficam de fora
// da lista e de qualquer total derivado dela — mesmo critério do balanço.
export const listDonationsService = async (
  adminId: string,
  year: number,
): Promise<unknown[]> => {
  console.log("IN - listDonationsService", { year });

  await verifyAdmin(adminId);

  const donations = await DonationModel.find(
    { referenceYear: year, status: TRANSACTION_STATUS.APPROVED },
    {},
    { sort: { createdAt: -1 }, lean: true },
  );

  console.log("OUT - listDonationsService", { count: donations.length });
  return donations;
};
