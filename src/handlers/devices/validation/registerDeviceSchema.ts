import { JSONSchemaType } from "ajv";
import { IRegisterDevicePayload } from "../../../types/devices";

export const RegisterDeviceSchema: JSONSchemaType<IRegisterDevicePayload> = {
  type: "object",
  properties: {
    token: { type: "string", minLength: 10 },
    platform: {
      type: "string",
      enum: ["android", "ios", "web", "desktop"],
    },
    installed: { type: "boolean", nullable: true },
  },
  required: ["token", "platform"],
  additionalProperties: false,
};
