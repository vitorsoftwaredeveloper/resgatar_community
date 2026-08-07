import { DASHBOARD_VISIBILITY_CARD_KEYS } from "../../constants/dashboardVisibility";

type DashboardVisibilityCardKey = (typeof DASHBOARD_VISIBILITY_CARD_KEYS)[number];

type IDashboardVisibilitySettings = Record<DashboardVisibilityCardKey, boolean>;

interface IUpdateDashboardVisibilityPayload {
  notices?: boolean;
  communityGoal?: boolean;
  birthdays?: boolean;
  banners?: boolean;
  videos?: boolean;
}

export {
  DashboardVisibilityCardKey,
  IDashboardVisibilitySettings,
  IUpdateDashboardVisibilityPayload,
};
