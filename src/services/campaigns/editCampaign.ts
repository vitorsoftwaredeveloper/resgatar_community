import { CampaignModel } from "../../models/Campaign";
import { STATUS_CODE } from "../../constants";
import { ICampaignResponse, ICreateCampaignPayload } from "../../types/campaigns";
import { verifyAdmin } from "../helper";
import { buildCampaignFields } from "./buildCampaignFields";

// Edita uma campanha (substituição completa dos campos editáveis). `order` é
// preservado; a reordenação tem endpoint próprio.
export const editCampaignService = async (
  adminId: string,
  campaignId: string,
  payload: ICreateCampaignPayload,
): Promise<ICampaignResponse> => {
  console.log("IN - editCampaignService");

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

    const { banner, action } = buildCampaignFields(payload);
    const active = payload.active ?? true;

    await CampaignModel.updateOne(
      { _id: campaignId },
      { title: payload.title, banner, action, active },
    );

    console.log("OUT - editCampaignService");

    return {
      id: campaignId,
      title: payload.title,
      banner,
      action,
      order: (campaign as any).order,
      active,
    };
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - editCampaignService");
  }
};
