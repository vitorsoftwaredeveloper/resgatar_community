export const CreateChargeValidatorSchema: any = {
  type: "object",
  properties: {
    transactionAmount: { type: "string", pattern: "^[0-9]+\\.[0-9]{2}$" },
    description: { type: "string" },
  },
  required: ["transactionAmount", "description"],
  additionalProperties: false,
};
