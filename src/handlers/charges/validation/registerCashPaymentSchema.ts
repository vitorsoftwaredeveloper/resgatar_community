export const RegisterCashPaymentValidatorSchema: any = {
  type: "object",
  properties: {
    memberId: { type: "string", minLength: 1 },
    referenceMonth: { type: "number", minimum: 0, maximum: 11 },
    value: { type: "string", pattern: "^[0-9]+,[0-9]{2}$" },
  },
  required: ["memberId", "referenceMonth"],
  additionalProperties: false,
};
