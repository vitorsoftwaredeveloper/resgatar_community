import { DonationModel } from "../../models/Donation";
import { RETURNED_TRANSACTION_STATUSES } from "../../constants/charges";

export const listMyDonationsService = async (
  memberId: string,
): Promise<unknown[]> => {
  console.log("IN - listMyDonationsService");

  const now = new Date();

  const donations = await DonationModel.find(
    {
      memberId,
      referenceMonth: now.getMonth(),
      referenceYear: now.getFullYear(),
      status: { $nin: RETURNED_TRANSACTION_STATUSES },
    },
    {},
    { sort: { createdAt: -1 }, lean: true },
  );

  console.log("OUT - listMyDonationsService", { count: donations.length });
  return donations;
};
