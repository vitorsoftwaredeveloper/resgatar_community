// Destino do clique no banner (ver constants/campaigns CAMPAIGN_ACTION_TYPE).
type CampaignActionType = "external" | "internal" | "none";

// Ação do banner. `value` depende do `type`:
//   external -> URL http/https aberta no navegador.
//   internal -> nome da rota interna que o app mapeia em navigation.navigate.
//   none     -> "" (banner sem clique).
interface ICampaignAction {
  type: CampaignActionType;
  value: string;
}

// Documento persistido. `banner` é o data URI base64 da imagem
// (png/jpeg/gif); `order` é a posição curada pelo admin no carrossel
// (0-indexado, menor = primeiro). `active` controla a publicação.
interface ICampaign {
  _id: string;
  title: string;
  banner: string;
  action: ICampaignAction;
  order: number;
  active: boolean;
}

// Payload vindo do app ao criar/editar. `active` é opcional (default true).
interface ICreateCampaignPayload {
  title: string;
  banner: string;
  action: ICampaignAction;
  active?: boolean;
}

// Forma retornada ao app. Inclui o banner base64 (carrossel carrega tudo de
// uma vez) e a `order` para o front respeitar a sequência curada.
interface ICampaignResponse {
  id: string;
  title: string;
  banner: string;
  action: ICampaignAction;
  order: number;
  active: boolean;
}

export {
  CampaignActionType,
  ICampaignAction,
  ICampaign,
  ICreateCampaignPayload,
  ICampaignResponse,
};
