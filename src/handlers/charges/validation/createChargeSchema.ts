export const CreateChargeValidatorSchema: any = {
  type: "object",
  properties: {
    referenceMonth: { type: "number", minimum: 0, maximum: 11 },
  },
  required: ["referenceMonth"],
  additionalProperties: false,
};
