import { DonationModel } from "../../models/Donation";
import { STATUS_CODE } from "../../constants";
import { findMemberById } from "../helper";

// Consulta o status de uma doação específica. Usado pelo app como fallback
// quando o push de confirmação não chega (ex.: usuário sai para o app do banco
// e volta sem tocar na notificação). Escopado ao membro dono da doação.
export const consultDonationService = async (
  memberId: string,
  transactionId: string,
): Promise<any> => {
  console.log("IN - consultDonationService");

  await findMemberById(memberId);

  try {
    const donation = await DonationModel.findOne(
      { transactionId, memberId },
      {},
      { lean: true },
    );

    if (!donation) {
      throw {
        message: "Donation not found",
        statusCode: STATUS_CODE.NOT_FOUND,
      };
    }

    return donation;
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - consultDonationService");
  }
};
