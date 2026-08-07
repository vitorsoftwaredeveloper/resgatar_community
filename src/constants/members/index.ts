const MEMBER_ROLES = {
  ADMIN: "admin",
  USER: "user",
  GUEST: "guest",
} as const;

const ROLE_LEVEL = {
  [MEMBER_ROLES.GUEST]: 0,
  [MEMBER_ROLES.USER]: 1,
  [MEMBER_ROLES.ADMIN]: 2,
} as const;

const INTERNAL_ROLES = [MEMBER_ROLES.USER, MEMBER_ROLES.ADMIN] as const;

const ASSIGNABLE_ROLES = [
  MEMBER_ROLES.GUEST,
  MEMBER_ROLES.USER,
  MEMBER_ROLES.ADMIN,
] as const;

// Tamanho máximo da imagem de perfil em caracteres (base64).
// ~700.000 chars ≈ 500 KB de imagem, bem abaixo do limite de 10 MB do
// API Gateway e dos 16 MB por documento do MongoDB.
const MAX_PROFILE_IMAGE_LENGTH = 700_000;

export {
  MEMBER_ROLES,
  ROLE_LEVEL,
  INTERNAL_ROLES,
  ASSIGNABLE_ROLES,
  MAX_PROFILE_IMAGE_LENGTH,
};
