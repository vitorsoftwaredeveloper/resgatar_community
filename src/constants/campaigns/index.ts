// Limites e enums das campanhas (banner em destaque no carrossel da home).

// Tamanho máximo do banner. O banner é guardado como data URI base64 dentro do
// próprio documento, então o teto vale para a string inteira recebida — protege
// o payload do carrossel e mantém folga frente ao limite de 16MB do Mongo.
const MAX_CAMPAIGN_BANNER_SIZE = 500 * 1024; // ~500KB

const MAX_CAMPAIGN_TITLE_LENGTH = 80;

// Tipos de imagem aceitos no banner.
const ALLOWED_BANNER_MIME_TYPES = ["image/png", "image/jpeg", "image/gif"] as const;

type BannerMimeType = (typeof ALLOWED_BANNER_MIME_TYPES)[number];

// data URI base64: "data:image/png;base64,iVBORw0K..." — captura o mime no grupo 1.
const BANNER_DATA_URI_REGEX =
  /^data:(image\/(?:png|jpeg|gif));base64,[A-Za-z0-9+/]+=*$/;

// Destino do clique no banner. O backend só guarda a intenção; quem resolve a
// navegação é o app:
//   EXTERNAL -> abre uma URL no navegador (value = URL http/https).
//   INTERNAL -> navega para uma rota interna do app (value = nome da rota).
//   NONE     -> banner apenas informativo, sem clique (value = "").
const CAMPAIGN_ACTION_TYPE = {
  EXTERNAL: "external",
  INTERNAL: "internal",
  NONE: "none",
} as const;

const CAMPAIGN_ACTION_TYPE_VALUES = Object.values(CAMPAIGN_ACTION_TYPE);

export {
  MAX_CAMPAIGN_BANNER_SIZE,
  MAX_CAMPAIGN_TITLE_LENGTH,
  ALLOWED_BANNER_MIME_TYPES,
  BannerMimeType,
  BANNER_DATA_URI_REGEX,
  CAMPAIGN_ACTION_TYPE,
  CAMPAIGN_ACTION_TYPE_VALUES,
};
