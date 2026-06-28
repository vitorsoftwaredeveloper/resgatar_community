import {
  MAX_COMMITMENT_TITLE_LENGTH,
  MAX_COMMITMENT_TIME_LENGTH,
  MAX_COMMITMENT_LOCATION_LENGTH,
  COMMITMENT_REPEAT_VALUES,
  COMMITMENT_ORDINAL_VALUES,
} from "../../../constants/commitments";

// Validação de forma. A coerência entre `repeat` e a âncora (weekday/ordinal/
// date) é checada no buildCommitmentFields, que lança BAD_REQUEST específico.
export const createCommitmentSchema: any = {
  type: "object",
  properties: {
    title: { type: "string", minLength: 1, maxLength: MAX_COMMITMENT_TITLE_LENGTH },
    time: { type: "string", minLength: 1, maxLength: MAX_COMMITMENT_TIME_LENGTH },
    location: {
      type: "string",
      minLength: 1,
      maxLength: MAX_COMMITMENT_LOCATION_LENGTH,
    },
    repeat: { type: "string", enum: COMMITMENT_REPEAT_VALUES },
    weekday: { type: "integer", minimum: 0, maximum: 6 },
    ordinal: { enum: COMMITMENT_ORDINAL_VALUES },
    date: { type: "string", format: "date" },
  },
  required: ["title", "time", "location", "repeat"],
  additionalProperties: false,
};
