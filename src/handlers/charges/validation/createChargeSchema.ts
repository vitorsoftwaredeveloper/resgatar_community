export const CreateChargeValidatorSchema: any = {
  type: "object",
  properties: {
    transactionAmount: { type: "number", pattern: "^[0-9]+\\.[0-9]{2}$" },
  },
  required: ["transactionAmount"],
  additionalProperties: false,
};
