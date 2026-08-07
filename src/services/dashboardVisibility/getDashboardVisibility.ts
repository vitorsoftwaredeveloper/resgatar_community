import { DashboardVisibilitySettingsModel } from "../../models/DashboardVisibilitySettings";
import { IDashboardVisibilitySettings } from "../../types/dashboardVisibility";
import {
  DASHBOARD_VISIBILITY_SINGLETON_ID,
  DEFAULT_DASHBOARD_VISIBILITY,
} from "../../constants/dashboardVisibility";

export const getDashboardVisibilitySettings =
  async (): Promise<IDashboardVisibilitySettings> => {
    console.log("IN - getDashboardVisibilitySettings");

    const settings = await DashboardVisibilitySettingsModel.findOne(
      { _id: DASHBOARD_VISIBILITY_SINGLETON_ID },
      { notices: 1, communityGoal: 1, birthdays: 1, banners: 1, videos: 1 },
      { lean: true },
    );

    console.log("OUT - getDashboardVisibilitySettings");

    if (!settings) return { ...DEFAULT_DASHBOARD_VISIBILITY };

    return {
      notices: settings.notices,
      communityGoal: settings.communityGoal,
      birthdays: settings.birthdays,
      banners: settings.banners,
      videos: settings.videos,
    };
  };
