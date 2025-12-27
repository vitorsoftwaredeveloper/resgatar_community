export const CreateNotificationSchema: any = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    type: { type: "string", enum: ["info", "success", "warning"] },
  },
  required: ["title", "description"],
  additionalProperties: false,
};
