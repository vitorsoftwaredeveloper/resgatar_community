import { DashboardVisibilitySettingsModel } from "../../models/DashboardVisibilitySettings";
import { IUpdateDashboardVisibilityPayload } from "../../types/dashboardVisibility";
import { DASHBOARD_VISIBILITY_SINGLETON_ID } from "../../constants/dashboardVisibility";
import { verifyAdmin } from "../helper";

export const updateDashboardVisibilityService = async (
  adminId: string,
  payload: IUpdateDashboardVisibilityPayload,
): Promise<void> => {
  console.log("IN - updateDashboardVisibilityService");

  await verifyAdmin(adminId);

  await DashboardVisibilitySettingsModel.updateOne(
    { _id: DASHBOARD_VISIBILITY_SINGLETON_ID },
    { $set: { ...payload, adminId } },
    { upsert: true },
  );

  console.log("OUT - updateDashboardVisibilityService");
};
