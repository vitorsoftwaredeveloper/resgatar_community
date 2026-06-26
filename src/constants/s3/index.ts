const RECEIPTS_PREFIX = "receipts";

// Tempo de validade (em segundos) das URLs pré-assinadas.
const UPLOAD_URL_EXPIRES_IN = 5 * 60; // 5 minutos
const VIEW_URL_EXPIRES_IN = 5 * 60; // 5 minutos

const ALLOWED_RECEIPT_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

type ReceiptContentType = (typeof ALLOWED_RECEIPT_CONTENT_TYPES)[number];

const CONTENT_TYPE_EXTENSION: Record<ReceiptContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export {
  RECEIPTS_PREFIX,
  UPLOAD_URL_EXPIRES_IN,
  VIEW_URL_EXPIRES_IN,
  ALLOWED_RECEIPT_CONTENT_TYPES,
  CONTENT_TYPE_EXTENSION,
  ReceiptContentType,
};
