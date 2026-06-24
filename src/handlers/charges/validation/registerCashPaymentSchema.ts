export const RegisterCashPaymentValidatorSchema: any = {
  type: "object",
  properties: {
    memberId: { type: "string", minLength: 1 },
    referenceMonth: { type: "number", minimum: 0, maximum: 11 },
  },
  required: ["memberId", "referenceMonth"],
  additionalProperties: false,
};
