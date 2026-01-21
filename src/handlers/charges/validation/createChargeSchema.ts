export const CreateChargeValidatorSchema: any = {
  type: "object",
  properties: {
    transactionAmount: { type: "string", pattern: "^[0-9]+,[0-9]{2}$" },
    referenceMonth: { type: "number", minimum: 0, maximum: 11 },
  },
  required: ["transactionAmount", "referenceMonth"],
  additionalProperties: false,
};
