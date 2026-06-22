const MEMBER_ROLES = {
  ADMIN: "admin",
  USER: "user",
  GUEST: "guest",
} as const;

// Tamanho máximo da imagem de perfil em caracteres (base64).
// ~700.000 chars ≈ 500 KB de imagem, bem abaixo do limite de 10 MB do
// API Gateway e dos 16 MB por documento do MongoDB.
const MAX_PROFILE_IMAGE_LENGTH = 700_000;

export { MEMBER_ROLES, MAX_PROFILE_IMAGE_LENGTH };
