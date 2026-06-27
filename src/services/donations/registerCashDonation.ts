import { randomUUID } from "crypto";
import { DonationModel } from "../../models/Donation";
import {
  IRegisterCashDonationPayload,
  IDonationDTO,
} from "../../types/donations";
import { findMemberById, verifyAdmin } from "../helper";
import { TRANSACTION_STATUS } from "../../constants/charges";

export const registerCashDonationService = async (
  memberId: string,
  payload: IRegisterCashDonationPayload,
): Promise<IDonationDTO> => {
  console.log("IN - registerCashDonationService");

  try {
    // Dinheiro não passa pelo MP (entra direto como APPROVED), então restringe
    // a admin para não inflar o balanço com lançamentos sem lastro.
    await verifyAdmin(memberId);
    await findMemberById(memberId);

    const now = new Date();
    const referenceMonth = payload.referenceMonth ?? now.getMonth();

    const donationDTO: IDonationDTO = {
      transactionId: `cash-${randomUUID()}`,
      memberId,
      donorName: payload.donorName?.trim() || undefined,
      amount: payload.amount,
      paymentMethodId: "cash",
      status: TRANSACTION_STATUS.APPROVED,
      dateApproved: now,
      referenceMonth, // 0-indexado
      referenceYear: now.getFullYear(),
    };

    await DonationModel.insertOne(donationDTO);

    return donationDTO;
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - registerCashDonationService");
  }
};
