export const createMemberSchema: any = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    phoneNumber: { type: "string" },
    firstName: { type: "string" },
    lastName: { type: "string" },
    bio: { type: "string", nullable: true },
    dateOfBirth: { type: "number", minimum: 0 },
    address: {
      type: "object",
      properties: {
        street: { type: "string", nullable: true },
        number: { type: "string", nullable: true },
        city: { type: "string", nullable: true },
        state: { type: "string", nullable: true },
        zip: { type: "string", nullable: true },
        complement: { type: "string", nullable: true },
      },
      required: [],
      additionalProperties: false,
      nullable: true,
    },
    role: { type: "string", enum: ["admin", "user"] },
    paymentInfo: {
      type: "object",
      properties: {
        datePayment: { type: "number", minimum: 1 },
        amount: {
          type: "string",
          pattern: "^[0-9]+,[0-9]{2}$",
        },
      },
      required: ["datePayment", "amount"],
      additionalProperties: false,
    },
    identification: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["CPF", "CNPJ"] },
        numberType: { type: "string" },
      },
      required: ["type", "numberType"],
      additionalProperties: false,
    },
    password: { type: "string" },
  },
  required: [
    "email",
    "phoneNumber",
    "firstName",
    "lastName",
    "dateOfBirth",
    "password",
    "paymentInfo",
    "identification",
  ],
  additionalProperties: false,
};
