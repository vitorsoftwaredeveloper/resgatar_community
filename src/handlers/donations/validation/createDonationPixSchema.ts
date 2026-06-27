// amount no formato "xx,xx" (mesmo padrão de paymentInfo.amount do membro).
export const CreateDonationPixValidatorSchema: any = {
  type: "object",
  properties: {
    amount: { type: "string", pattern: "^[0-9]+,[0-9]{2}$" },
    donorName: { type: "string", maxLength: 120 },
  },
  required: ["amount"],
  additionalProperties: false,
};
