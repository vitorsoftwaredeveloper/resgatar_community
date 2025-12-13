export const SignUpValidatorSchema: any = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    name: { type: "string", nullable: true },
    bio: { type: "string", nullable: true },
    age: { type: "integer", minimum: 1, nullable: true },
    phoneNumber: { type: "string" },
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
    paymentInfo: {
      type: "object",
      properties: {
        datePayment: { type: "number", nullable: true },
        amount: { type: "number", nullable: true },
      },
      required: ["datePayment", "amount"],
      additionalProperties: false,
    },
    password: { type: "string" },
    role: { type: "string", enum: ["admin", "user"], nullable: true },
  },
  required: ["email", "password", "phoneNumber", "paymentInfo"],
  additionalProperties: false,
};
