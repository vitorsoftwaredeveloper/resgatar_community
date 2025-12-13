interface ICreateChargePayload {
  transactionAmount: number;
  description: string;
}

interface ICreateChargeMPago {
  transaction_amount: number;
  description: string;
  payment_method_id: "pix";
  payer: { email: string };
}

export { ICreateChargePayload, ICreateChargeMPago };
