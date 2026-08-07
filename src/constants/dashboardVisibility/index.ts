const DASHBOARD_VISIBILITY_SINGLETON_ID = "singleton";

const DASHBOARD_VISIBILITY_CARD_KEYS = [
  "notices",
  "communityGoal",
  "birthdays",
  "banners",
  "videos",
] as const;

const DEFAULT_DASHBOARD_VISIBILITY = {
  notices: false,
  communityGoal: false,
  birthdays: false,
  banners: true,
  videos: true,
};

export {
  DASHBOARD_VISIBILITY_SINGLETON_ID,
  DASHBOARD_VISIBILITY_CARD_KEYS,
  DEFAULT_DASHBOARD_VISIBILITY,
};
