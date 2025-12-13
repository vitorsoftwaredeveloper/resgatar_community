export const SignUpValidatorSchema: any = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    phoneNumber: { type: "string" },
    firstName: { type: "string", nullable: true },
    lastName: { type: "string", nullable: true },
    bio: { type: "string", nullable: true },
    age: { type: "integer", minimum: 1, nullable: true },
    address: {
      type: "object",
      properties: {
        street: { type: "string", nullable: true },
        number: { type: "string", nullable: true },
        city: { type: "string", nullable: true },
        state: { type: "string", nullable: true },
        zip: { type: "string", nullable: true },
      },
      required: [],
      additionalProperties: false,
      nullable: true,
    },
    role: { type: "string", enum: ["admin", "user"], nullable: true },
    paymentInfo: {
      type: "object",
      properties: {
        datePayment: { type: "number", nullable: true },
        amount: { type: "number", nullable: true },
      },
      required: ["datePayment", "amount"],
      additionalProperties: false,
    },
    identification: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["CPF", "CNPJ"] },
        number: { type: "string" },
      },
      required: ["type", "number"],
      additionalProperties: false,
    },
    password: { type: "string" },
  },
  required: [
    "email",
    "password",
    "phoneNumber",
    "paymentInfo",
    "identification",
  ],
  additionalProperties: false,
};
