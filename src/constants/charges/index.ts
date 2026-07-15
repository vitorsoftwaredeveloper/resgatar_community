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

// "Devolvido": o dinheiro voltou para quem pagou. Vale tanto para PIX
// (refunded) quanto para cartão (charged_back). Transações nesse estado NÃO
// podem contar como arrecadação em nenhuma agregação.
const RETURNED_TRANSACTION_STATUSES = [
  TRANSACTION_STATUS.REFUNDED,
  TRANSACTION_STATUS.CHARGED_BACK,
];

const isReturnedTransaction = (status?: string | null): boolean =>
  !!status && RETURNED_TRANSACTION_STATUSES.includes(status);

const CONTRIBUTION_PAYMENT_METHOD = {
  PIX: "pix",
  CASH: "cash",
};

// Meta mensal padrão (em reais) usada quando o admin ainda não definiu uma
// meta para o mês. É apenas um fallback de leitura — não é persistido.
const DEFAULT_MONTHLY_GOAL = 2000;

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
  RETURNED_TRANSACTION_STATUSES,
  isReturnedTransaction,
  CONTRIBUTION_PAYMENT_METHOD,
  MONTH_KEYS,
  DEFAULT_MONTHLY_GOAL,
};
