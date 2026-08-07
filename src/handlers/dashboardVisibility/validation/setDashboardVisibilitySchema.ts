export const setDashboardVisibilitySchema: any = {
  type: "object",
  properties: {
    notices: { type: "boolean" },
    communityGoal: { type: "boolean" },
    birthdays: { type: "boolean" },
    banners: { type: "boolean" },
    videos: { type: "boolean" },
  },
  required: [],
  additionalProperties: false,
};
