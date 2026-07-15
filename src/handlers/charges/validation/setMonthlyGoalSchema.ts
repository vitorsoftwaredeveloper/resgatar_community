export const setMonthlyGoalSchema: any = {
  type: "object",
  properties: {
    year: { type: "number", minimum: 2000, maximum: 2100 },
    // 1-indexado (1 = janeiro), alinhado ao getGoalProgress.
    month: { type: "number", minimum: 1, maximum: 12 },
    amount: { type: "string", pattern: "^[0-9]+,[0-9]{2}$" },
  },
  required: ["year", "month", "amount"],
  additionalProperties: false,
};
