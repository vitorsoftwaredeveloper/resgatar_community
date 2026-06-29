import { CampaignModel } from "../../models/Campaign";
import { STATUS_CODE } from "../../constants";
import { verifyAdmin } from "../helper";

// Remove uma campanha e fecha o buraco na sequência, reindexando as posteriores
// para manter `order` contíguo (0,1,2,...).
export const removeCampaignService = async (
  adminId: string,
  campaignId: string,
): Promise<void> => {
  console.log("IN - removeCampaignService");

  try {
    await verifyAdmin(adminId);

    const campaign = await CampaignModel.findById(
      campaignId,
      { order: 1 },
      { lean: true },
    );

    if (!campaign) {
      throw {
        statusCode: STATUS_CODE.NOT_FOUND,
        message: "Campanha não encontrada.",
      };
    }

    await CampaignModel.deleteOne({ _id: campaignId });

    await CampaignModel.updateMany(
      { order: { $gt: (campaign as any).order } },
      { $inc: { order: -1 } },
    );

    console.log("OUT - removeCampaignService");
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - removeCampaignService");
  }
};
