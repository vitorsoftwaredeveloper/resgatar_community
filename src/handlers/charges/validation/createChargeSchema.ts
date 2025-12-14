export const CreateChargeValidatorSchema: any = {
  type: "object",
  properties: {
    transactionAmount: { type: "number", minimum: 0 },
    description: { type: "string" },
  },
  required: ["transactionAmount", "description"],
  additionalProperties: false,
};
