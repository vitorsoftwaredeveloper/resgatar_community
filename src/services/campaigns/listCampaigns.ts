import { CampaignModel } from "../../models/Campaign";
import { ICampaignResponse } from "../../types/campaigns";
import { verifyAdmin, verifyDashboardVisibility } from "../helper";

export const listCampaignsService = async (
  requesterId: string,
  includeInactive = false,
): Promise<ICampaignResponse[]> => {
  console.log("IN - listCampaignsService");

  const filter = includeInactive ? {} : { active: true };

  if (includeInactive) {
    await verifyAdmin(requesterId);
  } else {
    await verifyDashboardVisibility(requesterId, "banners");
  }

  const campaigns = await CampaignModel.find(
    filter,
    { _id: 1, title: 1, banner: 1, action: 1, order: 1, active: 1 },
    { sort: { order: 1 }, lean: true },
  );

  console.log("OUT - listCampaignsService");

  return campaigns.map((c: any) => ({
    id: c._id,
    title: c.title,
    banner: c.banner,
    action: c.action,
    order: c.order,
    active: c.active,
  }));
};
