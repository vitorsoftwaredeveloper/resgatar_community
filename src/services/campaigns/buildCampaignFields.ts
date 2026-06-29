import { STATUS_CODE } from "../../constants";
import {
  BANNER_DATA_URI_REGEX,
  CAMPAIGN_ACTION_TYPE,
  MAX_CAMPAIGN_BANNER_SIZE,
} from "../../constants/campaigns";
import { ICampaignAction, ICreateCampaignPayload } from "../../types/campaigns";

const badRequest = (message: string) => ({
  statusCode: STATUS_CODE.BAD_REQUEST,
  message,
});

// Garante que o banner é um data URI base64 de imagem suportada e dentro do
// teto de tamanho (o data URI é guardado cru no documento).
const validateBanner = (banner: string): void => {
  if (banner.length > MAX_CAMPAIGN_BANNER_SIZE) {
    throw badRequest(
      `Banner excede o tamanho máximo de ${Math.floor(
        MAX_CAMPAIGN_BANNER_SIZE / 1024,
      )}KB.`,
    );
  }

  if (!BANNER_DATA_URI_REGEX.test(banner)) {
    throw badRequest(
      "Banner inválido. Envie um data URI base64 de imagem PNG, JPEG ou GIF.",
    );
  }
};

// Normaliza a ação conforme o tipo. external exige URL http/https; internal
// exige uma rota não vazia; none ignora qualquer value (vira "").
const buildAction = (action: ICampaignAction): ICampaignAction => {
  const value = (action.value ?? "").trim();

  if (action.type === CAMPAIGN_ACTION_TYPE.NONE) {
    return { type: CAMPAIGN_ACTION_TYPE.NONE, value: "" };
  }

  if (!value) {
    throw badRequest("Ação do banner requer um destino (value).");
  }

  if (action.type === CAMPAIGN_ACTION_TYPE.EXTERNAL && !/^https?:\/\//i.test(value)) {
    throw badRequest("Ação externa requer uma URL http/https válida.");
  }

  return { type: action.type, value };
};

// Valida e monta os campos persistíveis (banner + action) compartilhados entre
// criação e edição. `title`/`active` são repassados pelo service.
export const buildCampaignFields = (
  payload: ICreateCampaignPayload,
): { banner: string; action: ICampaignAction } => {
  validateBanner(payload.banner);
  const action = buildAction(payload.action);

  return { banner: payload.banner, action };
};
