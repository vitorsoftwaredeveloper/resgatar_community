import { MAX_PROFILE_IMAGE_LENGTH } from "../../../constants/members";

export const editMemberSchema: any = {
  type: "object",
  properties: {
    _id: { type: "string" },
    email: { type: "string", format: "email" },
    phoneNumber: { type: "string" },
    firstName: { type: "string" },
    lastName: { type: "string" },
    bio: { type: "string", nullable: true, minLength: 0 },
    profileImage: {
      type: "string",
      nullable: true,
      minLength: 0,
      maxLength: MAX_PROFILE_IMAGE_LENGTH,
    },
    dateOfBirth: { type: "number", minimum: 0 },
    address: {
      type: "object",
      properties: {
        street: { type: "string", nullable: true, minLength: 0 },
        number: { type: "string", nullable: true, minLength: 0 },
        city: { type: "string", nullable: true, minLength: 0 },
        state: { type: "string", nullable: true, minLength: 0 },
        zip: { type: "string", nullable: true, minLength: 0 },
        complement: { type: "string", nullable: true, minLength: 0 },
      },
      required: [],
      additionalProperties: false,
      nullable: true,
    },
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
    role: { type: "string", enum: ["admin", "user", "guest"] },
    identification: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["CPF", "CNPJ"] },
        numberType: { type: "string", pattern: "^[0-9]+$" },
      },
      required: ["type", "numberType"],
      additionalProperties: false,
    },
  },
  required: [],
  additionalProperties: false,
};
