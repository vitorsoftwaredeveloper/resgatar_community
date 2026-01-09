export const updatePasswordSchema: any = {
  type: "object",
  properties: {
    password: {
      type: "string",
      pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$",
    },
  },
  required: ["password"],
  additionalProperties: false,
};
