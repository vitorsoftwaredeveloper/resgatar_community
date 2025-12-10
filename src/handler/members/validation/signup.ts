import { JSONSchemaType } from "ajv";

export const SignUpValidatorSchema: any = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    name: { type: "string", nullable: true },
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
    password: { type: "string" },
  },
  required: ["email", "password"],
  additionalProperties: false,
};
