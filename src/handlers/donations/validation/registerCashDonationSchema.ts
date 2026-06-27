export const RegisterCashDonationValidatorSchema: any = {
  type: "object",
  properties: {
    amount: { type: "string", pattern: "^[0-9]+,[0-9]{2}$" },
    donorName: { type: "string", maxLength: 120 },
    referenceMonth: { type: "number", minimum: 0, maximum: 11 },
  },
  required: ["amount"],
  additionalProperties: false,
};
