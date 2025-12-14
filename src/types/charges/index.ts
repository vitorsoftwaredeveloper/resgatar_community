interface ICreateChargePayload {
  transactionAmount: number;
  description: string;
}

interface ICreateChargeMPagoRequest {
  transaction_amount: number;
  description: string;
  payment_method_id: "pix";
  payer: { email: string };
}
export interface ICreateChargeMPagoResponse {
  id: number;
  date_created: string;
  date_of_expiration?: string;
  status: "pending" | "approved" | "cancelled" | "rejected";
  status_detail:
    | "pending_waiting_payment"
    | "pending_payment"
    | "pending_review_manual"
    | "accredited"
    | "expired"
    | "cancelled";
  transaction_amount: number;
  currency_id: "BRL";
  payment_method_id: "pix";
  payer: {
    email: string;
  };
  point_of_interaction: {
    type: "PIX";
    transaction_data: {
      qr_code: string;
      qr_code_base64: string;
      ticket_url: string;
    };
  };
  metadata?: Record<string, unknown>;
  notification_url?: string;
}

export { ICreateChargePayload, ICreateChargeMPagoRequest };
