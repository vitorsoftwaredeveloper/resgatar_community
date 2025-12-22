export const createNewContributionByYearSchema: any = {
  type: "object",
  properties: {
    year: { type: "number" },
  },
  required: ["year"],
  additionalProperties: false,
};
