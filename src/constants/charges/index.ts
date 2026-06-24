const PAYMENT_METHOD_ID = {
  PIX: "pix",
  BOLETO: "boleto",
  CREDIT_CARD: "credit_card",
};

const PAYMENT_TYPE_ID = {
  BANK_TRANSFER: "bank_transfer",
  TICKET: "ticket",
  CREDIT_CARD: "credit_card",
};

const CURRENCY_ID = {
  BRL: "BRL",
  USD: "USD",
  EUR: "EUR",
};

const TRANSACTION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  CHARGED_BACK: "charged_back",
};

const CONTRIBUTION_PAYMENT_METHOD = {
  PIX: "pix",
  CASH: "cash",
};

const MONTH_KEYS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export {
  PAYMENT_METHOD_ID,
  PAYMENT_TYPE_ID,
  CURRENCY_ID,
  TRANSACTION_STATUS,
  CONTRIBUTION_PAYMENT_METHOD,
  MONTH_KEYS,
};
