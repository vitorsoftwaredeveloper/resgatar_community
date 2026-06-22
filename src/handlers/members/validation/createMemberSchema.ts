import { MAX_PROFILE_IMAGE_LENGTH } from "../../../constants/members";

export const createMemberSchema: any = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    phoneNumber: { type: "string", minLength: 10, pattern: "^[0-9]+$" },
    firstName: { type: "string", minLength: 1 },
    lastName: { type: "string", minLength: 1 },
    bio: { type: "string", nullable: true },
    profileImage: {
      type: "string",
      nullable: true,
      maxLength: MAX_PROFILE_IMAGE_LENGTH,
    },
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
        datePayment: { type: "number", minimum: 1, maximum: 31 },
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
        numberType: { type: "string", minLength: 11, maxLength: 14, pattern: "^[0-9]+$" },
      },
      required: ["type", "numberType"],
      additionalProperties: false,
    },
    password: {
      type: "string",
      minLength: 8,
      pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#]).+$",
    },
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
