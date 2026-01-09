export const CreateNotificationSchema: any = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    type: { type: "string", enum: ["info", "alert", "warning"] },
  },
  required: ["title", "description"],
  additionalProperties: false,
};
