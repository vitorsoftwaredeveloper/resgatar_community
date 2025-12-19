interface ICreateChargePayload {
  transactionAmount: string;
  description: string;
}

interface ICreateChargeMPagoRequest {
  transaction_amount: number;
  payment_method_id: string;
  description: string;
  payer: {
    identification: {
      number: string;
      type: string;
    };
    last_name: string;
    first_name: string;
    email: string;
  };
}
interface ICreateChargeMPagoResponse {
  id: number;
  date_created: string;
  date_approved: string | null;
  date_last_updated: string;
  date_of_expiration: string;
  money_release_date: string | null;
  money_release_status: string | null;
  operation_type: string;
  issuer_id: string;
  payment_method_id: string;
  payment_type_id: string;

  payment_method: {
    id: string;
    type: string;
    issuer_id: string;
  };

  status: string;
  status_detail: string;
  currency_id: string;
  description: string;
  live_mode: boolean;

  sponsor_id: number | null;
  authorization_code: string | null;
  money_release_schema: unknown | null;

  taxes_amount: number;
  counter_currency: unknown | null;
  brand_id: string | null;
  shipping_amount: number;

  build_version: string;
  pos_id: string | null;
  store_id: string | null;
  integrator_id: string | null;
  platform_id: string | null;
  corporation_id: string | null;

  charges_execution_info: {
    internal_execution: {
      date: string;
      execution_id: string;
    };
  };

  payer: {
    identification: {
      number: string | null;
      type: string | null;
    };
    entity_type: string | null;
    phone: {
      number: string | null;
      extension: string | null;
      area_code: string | null;
    };
    last_name: string | null;
    id: string;
    type: string | null;
    first_name: string | null;
    email: string | null;
  };

  collector_id: number;
  marketplace_owner: string | null;
  metadata: Record<string, unknown>;

  additional_info: {
    tracking_id: string;
  };

  order: Record<string, unknown>;
  external_reference: string | null;

  transaction_amount: number;
  transaction_amount_refunded: number;
  coupon_amount: number;

  differential_pricing_id: string | null;
  financing_group: string | null;
  deduction_schema: string | null;
  callback_url: string | null;

  installments: number;

  transaction_details: {
    payment_method_reference_id: string | null;
    acquirer_reference: string | null;
    net_received_amount: number;
    total_paid_amount: number;
    overpaid_amount: number;
    external_resource_url: string | null;
    installment_amount: number;
    financial_institution: string | null;
    payable_deferral_period: string | null;
    bank_transfer_id: string | null;
    transaction_id: string | null;
  };

  fee_details: unknown[];

  charges_details: Array<{
    id: string;
    name: string;
    type: string;
    accounts: Record<string, unknown>;
    client_id: number;
    date_created: string;
    last_updated: string;
    amounts: Record<string, unknown>;
    metadata: Record<string, unknown>;
    reserve_id: string | null;
    refund_charges: unknown[];
    external_charge_id: string;
  }>;

  captured: boolean;
  binary_mode: boolean;
  call_for_authorize_id: string | null;
  statement_descriptor: string | null;

  card: Record<string, unknown>;
  notification_url: string | null;
  refunds: unknown[];

  processing_mode: string;
  merchant_account_id: string | null;
  merchant_number: string | null;

  acquirer_reconciliation: unknown[];

  point_of_interaction: {
    type: string;
    business_info: {
      unit: string;
      sub_unit: string;
      branch: string;
    };
    location: {
      state_id: string | null;
      source: string | null;
    };
    application_data: {
      name: string | null;
      operating_system: string | null;
      version: string | null;
    };
    transaction_data: {
      qr_code: string;
      qr_code_base64: string;
      bank_transfer_id: string | null;
      transaction_id: string | null;
      e2e_id: string | null;
      financial_institution: string | null;
      ticket_url: string;
      merchant_category_code: string | null;
      bank_info: Record<string, unknown>;
    };
  };

  accounts_info: unknown | null;
  release_info: unknown | null;
  tags: string[] | null;
}

interface IConsultChargeMPagoResponse {
  id: number;
  status: string;
  status_detail: string;
  payment_method_id: string;
  payment_type_id: string;
  transaction_amount: number;
  currency_id: string;
  date_created: string;
  date_approved: string;
  date_last_updated: string;
  external_reference: string;
  payer: {
    email: string;
  };
  point_of_interaction: {
    transaction_data: {
      qr_code: string;
      qr_code_base64: string;
      ticket_url: string;
    };
  };
}

interface IChargeDTO {
  transactionId: number;
  memberId: string;
  status: string;
  statusDetail: string;
  transactionAmount: number;
  paymentMethodId: string;
  currencyId: string;
  dateCreated: string;
  dateOfExpiration: string;
  dateApproved?: string;
  payer: {
    firstName: string;
    lastName: string;
    email: string;
    identification: {
      type: "CPF" | "CNPJ";
      numberType: string;
    };
  };
  transactionData: {
    qrCode?: string;
    qrCodeBase64?: string;
    ticketUrl?: string;
  };
}

export {
  ICreateChargePayload,
  ICreateChargeMPagoRequest,
  IConsultChargeMPagoResponse,
  ICreateChargeMPagoResponse,
  IChargeDTO,
};
