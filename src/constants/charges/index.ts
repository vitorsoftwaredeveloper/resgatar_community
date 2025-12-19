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

export { PAYMENT_METHOD_ID, PAYMENT_TYPE_ID, CURRENCY_ID, TRANSACTION_STATUS };
