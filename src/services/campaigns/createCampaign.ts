import { v4 as uuidv4 } from "uuid";
import { CampaignModel } from "../../models/Campaign";
import {
  ICampaign,
  ICampaignResponse,
  ICreateCampaignPayload,
} from "../../types/campaigns";
import { verifyAdmin } from "../helper";
import { buildCampaignFields } from "./buildCampaignFields";

// Cria uma campanha no fim do carrossel. O admin reposiciona depois via reorder.
export const createCampaignService = async (
  adminId: string,
  payload: ICreateCampaignPayload,
): Promise<ICampaignResponse> => {
  console.log("IN - createCampaignService");

  try {
    await verifyAdmin(adminId);

    const { banner, action } = buildCampaignFields(payload);
    const total = await CampaignModel.count({});

    const campaign: ICampaign = {
      _id: uuidv4(),
      title: payload.title,
      banner,
      action,
      order: total,
      active: payload.active ?? true,
    };

    await CampaignModel.insertOne(campaign);

    console.log("OUT - createCampaignService");

    return {
      id: campaign._id,
      title: campaign.title,
      banner: campaign.banner,
      action: campaign.action,
      order: campaign.order,
      active: campaign.active,
    };
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - createCampaignService");
  }
};
