import {
  MAX_CAMPAIGN_TITLE_LENGTH,
  CAMPAIGN_ACTION_TYPE_VALUES,
} from "../../../constants/campaigns";

// Validação de forma. O formato/tamanho do banner e a coerência entre
// action.type e action.value são checados no buildCampaignFields, que lança
// BAD_REQUEST específico.
export const createCampaignSchema: any = {
  type: "object",
  properties: {
    title: { type: "string", minLength: 1, maxLength: MAX_CAMPAIGN_TITLE_LENGTH },
    banner: { type: "string", minLength: 1 },
    action: {
      type: "object",
      properties: {
        type: { type: "string", enum: CAMPAIGN_ACTION_TYPE_VALUES },
        value: { type: "string" },
      },
      required: ["type"],
      additionalProperties: false,
    },
    active: { type: "boolean" },
  },
  required: ["title", "banner", "action"],
  additionalProperties: false,
};
