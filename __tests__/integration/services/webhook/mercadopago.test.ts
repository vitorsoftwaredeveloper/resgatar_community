import { ChargeModel } from "../../../../src/models/Charge";
import { ContributionModel } from "../../../../src/models/Contribution";
import { MemberModel } from "../../../../src/models/Member";
import * as mercadopagoIntegration from "../../../../src/integrations/mercadopago";
import * as firebaseIntegration from "../../../../src/integrations/firebase";
import * as mongooseUtil from "../../../../src/utils/mongoose";
import { processMercadoPagoWebhook } from "../../../../src/services/webhook/mercadopago";
import { TRANSACTION_STATUS } from "../../../../src/constants/charges";
import { IMercadoPagoWebhookPayload } from "../../../../src/types/charges";

const makePayload = (overrides: Partial<IMercadoPagoWebhookPayload> = {}): IMercadoPagoWebhookPayload => ({
  action: "payment.updated",
  api_version: "v1",
  data: { id: "12345" },
  date_created: "2026-01-01T00:00:00Z",
  id: "webhook-id",
  live_mode: false,
  type: "payment",
  user_id: 1,
  ...overrides,
});

const mockCharge = {
  transactionId: 12345,
  memberId: "member-1",
  status: TRANSACTION_STATUS.PENDING,
  statusDetail: "pending_waiting_payment",
  transactionAmount: "50",
  dateCreated: "2026-01-15T00:00:00Z",
  referenceMonth: 0,
};

const mockPaymentData = {
  id: 12345,
  status: TRANSACTION_STATUS.APPROVED,
  status_detail: "accredited",
  date_approved: "2026-01-15T12:00:00Z",
  transaction_amount: 50,
  currency_id: "BRL",
  date_created: "2026-01-15T00:00:00Z",
  date_last_updated: "2026-01-15T12:00:00Z",
  external_reference: "",
  payer: { email: "payer@test.com" },
  point_of_interaction: { transaction_data: { qr_code: "", qr_code_base64: "", ticket_url: "" } },
  payment_method_id: "pix",
  payment_type_id: "bank_transfer",
};

describe("processMercadoPagoWebhook (integration)", () => {
  let mpClientMock: { consultPayment: jest.Mock };
  let createMpClientSpy: jest.SpyInstance;
  let chargeModelFindOneSpy: jest.SpyInstance;
  let chargeModelUpdateOneSpy: jest.SpyInstance;
  let contributionModelUpdateOneSpy: jest.SpyInstance;
  let memberModelFindByIdSpy: jest.SpyInstance;
  let sendPushSpy: jest.SpyInstance;
  let executeTransactionSpy: jest.SpyInstance;

  beforeEach(() => {
    mpClientMock = { consultPayment: jest.fn().mockResolvedValue(mockPaymentData) };
    createMpClientSpy = jest
      .spyOn(mercadopagoIntegration, "createMercadoPagoClient")
      .mockResolvedValue(mpClientMock as any);

    chargeModelFindOneSpy = jest
      .spyOn(ChargeModel, "findOne")
      .mockResolvedValue(mockCharge as any);

    chargeModelUpdateOneSpy = jest
      .spyOn(ChargeModel, "updateOne")
      .mockResolvedValue({} as any);

    contributionModelUpdateOneSpy = jest
      .spyOn(ContributionModel, "updateOne")
      .mockResolvedValue({} as any);

    memberModelFindByIdSpy = jest
      .spyOn(MemberModel, "findById")
      .mockResolvedValue({ _id: "member-1", pushToken: "token-abc" } as any);

    sendPushSpy = jest
      .spyOn(firebaseIntegration, "sendPushNotificationToTokens")
      .mockResolvedValue([]);

    executeTransactionSpy = jest
      .spyOn(mongooseUtil, "executeMongoTransaction")
      .mockImplementation(async (fn) => { await fn({} as any); });
  });

  afterEach(() => jest.restoreAllMocks());

  it("should skip non-payment webhook types", async () => {
    await processMercadoPagoWebhook(makePayload({ type: "subscription" }));

    expect(createMpClientSpy).not.toHaveBeenCalled();
  });

  it("should consult the payment via Mercado Pago client", async () => {
    await processMercadoPagoWebhook(makePayload());

    expect(mpClientMock.consultPayment).toHaveBeenCalledWith("12345");
  });

  it("should skip processing when charge is not found", async () => {
    chargeModelFindOneSpy.mockResolvedValue(null);

    await processMercadoPagoWebhook(makePayload());

    expect(executeTransactionSpy).not.toHaveBeenCalled();
  });

  it("should skip processing when charge status is unchanged", async () => {
    chargeModelFindOneSpy.mockResolvedValue({ ...mockCharge, status: TRANSACTION_STATUS.APPROVED });

    await processMercadoPagoWebhook(makePayload());

    expect(executeTransactionSpy).not.toHaveBeenCalled();
  });

  it("should update charge and contribution inside a transaction", async () => {
    await processMercadoPagoWebhook(makePayload());

    expect(executeTransactionSpy).toHaveBeenCalledTimes(1);
    expect(chargeModelUpdateOneSpy).toHaveBeenCalledWith(
      { transactionId: mockCharge.transactionId },
      expect.objectContaining({ $set: expect.objectContaining({ status: TRANSACTION_STATUS.APPROVED }) }),
    );
    expect(contributionModelUpdateOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({ memberId: "member-1" }),
      expect.objectContaining({ $set: expect.objectContaining({ "months.january.paid": true }) }),
    );
  });

  it("should send push notification when payment is approved", async () => {
    await processMercadoPagoWebhook(makePayload());

    expect(sendPushSpy).toHaveBeenCalledWith(
      ["token-abc"],
      "Pagamento confirmado!",
      expect.any(String),
    );
  });

  it("should not send notification when payment is not approved", async () => {
    mpClientMock.consultPayment.mockResolvedValue({ ...mockPaymentData, status: TRANSACTION_STATUS.REJECTED });

    await processMercadoPagoWebhook(makePayload());

    expect(sendPushSpy).not.toHaveBeenCalled();
  });

  it("should not send notification when member has no pushToken", async () => {
    memberModelFindByIdSpy.mockResolvedValue({ _id: "member-1", pushToken: null } as any);

    await processMercadoPagoWebhook(makePayload());

    expect(sendPushSpy).not.toHaveBeenCalled();
  });

  it("should map referenceMonth index to correct month key", async () => {
    chargeModelFindOneSpy.mockResolvedValue({ ...mockCharge, referenceMonth: 5 }); // June

    await processMercadoPagoWebhook(makePayload());

    expect(contributionModelUpdateOneSpy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ $set: expect.objectContaining({ "months.june.paid": true }) }),
    );
  });
});
