import { Schema } from "mongoose";
import { createInstanceMongoose } from "../repositories/mongoose";
import { CAMPAIGN_ACTION_TYPE_VALUES } from "../constants/campaigns";

// Campanha em destaque no carrossel da home. Só admins criam/editam.
//
// `banner` guarda a imagem como data URI base64 (png/jpeg/gif) dentro do
// próprio documento — sem S3. `order` é a posição curada pelo admin (0-indexado,
// menor = primeiro do carrossel). `action` define o que acontece ao tocar o
// banner; o backend só guarda a intenção e o app resolve a navegação.
const CampaignActionSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: CAMPAIGN_ACTION_TYPE_VALUES,
    },
    value: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const CampaignSchema = new Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    banner: { type: String, required: true },
    action: { type: CampaignActionSchema, required: true },
    order: { type: Number, required: true },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

// Carrossel sempre na ordem curada.
CampaignSchema.index({ order: 1 });
// O carrossel filtra só as publicadas.
CampaignSchema.index({ active: 1 });

export const CampaignModel = createInstanceMongoose("campaigns", CampaignSchema);
