import { ChargeModel } from "../../../../src/models/Charge";
import { ContributionModel } from "../../../../src/models/Contribution";
import { DonationModel } from "../../../../src/models/Donation";
import { MemberModel } from "../../../../src/models/Member";
import * as mercadopagoIntegration from "../../../../src/integrations/mercadopago";
import * as firebaseIntegration from "../../../../src/integrations/firebase";
import * as mongooseUtil from "../../../../src/utils/mongoose";
import { processMercadoPagoWebhook } from "../../../../src/services/webhook/mercadopago";
import { TRANSACTION_STATUS } from "../../../../src/constants/charges";
import { IMercadoPagoWebhookPayload } from "../../../../src/types/charges";
import { DONATION_EXTERNAL_REFERENCE } from "../../../../src/services/donations/createDonationPix";

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
      expect.objectContaining({
        type: "PAYMENT_CONFIRMED",
        paymentMethod: "pix",
        transactionId: String(mockCharge.transactionId),
      }),
    );
  });

  it("should include transactionId in notification so the app can close the correct PIX screen", async () => {
    const customCharge = { ...mockCharge, transactionId: 99999 };
    chargeModelFindOneSpy.mockResolvedValue(customCharge as any);

    await processMercadoPagoWebhook(makePayload());

    expect(sendPushSpy).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ transactionId: "99999" }),
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

  it("should revert the contribution month when an approved charge is refunded", async () => {
    chargeModelFindOneSpy.mockResolvedValue({ ...mockCharge, status: TRANSACTION_STATUS.APPROVED });
    mpClientMock.consultPayment.mockResolvedValue({ ...mockPaymentData, status: TRANSACTION_STATUS.REFUNDED });

    await processMercadoPagoWebhook(makePayload());

    expect(contributionModelUpdateOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({ memberId: "member-1" }),
      expect.objectContaining({
        $set: { "months.january.paid": false },
        $unset: {
          "months.january.paidAt": "",
          "months.january.value": "",
          "months.january.paymentMethod": "",
        },
      }),
    );
  });

  it("should revert the contribution month on a chargeback", async () => {
    chargeModelFindOneSpy.mockResolvedValue({ ...mockCharge, status: TRANSACTION_STATUS.APPROVED });
    mpClientMock.consultPayment.mockResolvedValue({ ...mockPaymentData, status: TRANSACTION_STATUS.CHARGED_BACK });

    await processMercadoPagoWebhook(makePayload());

    expect(contributionModelUpdateOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({ memberId: "member-1" }),
      expect.objectContaining({ $set: { "months.january.paid": false } }),
    );
  });

  it("should not mark the contribution as paid when a charge is rejected", async () => {
    mpClientMock.consultPayment.mockResolvedValue({ ...mockPaymentData, status: TRANSACTION_STATUS.REJECTED });

    await processMercadoPagoWebhook(makePayload());

    expect(contributionModelUpdateOneSpy).not.toHaveBeenCalled();
  });
});

describe("processMercadoPagoWebhook — donation flow (integration)", () => {
  const mockDonation = {
    transactionId: "12345",
    memberId: "member-1",
    status: TRANSACTION_STATUS.PENDING,
  };

  const mockDonationPaymentData = {
    ...{
      id: 12345,
      status: TRANSACTION_STATUS.APPROVED,
      status_detail: "accredited",
      date_approved: "2026-06-27T12:00:00Z",
      transaction_amount: 50,
      currency_id: "BRL",
      date_created: "2026-06-27T10:00:00Z",
      date_last_updated: "2026-06-27T12:00:00Z",
      payer: { email: "payer@test.com" },
      point_of_interaction: { transaction_data: { qr_code: "", qr_code_base64: "", ticket_url: "" } },
      payment_method_id: "pix",
      payment_type_id: "bank_transfer",
    },
    external_reference: DONATION_EXTERNAL_REFERENCE,
  };

  const makePayload = (overrides: Partial<IMercadoPagoWebhookPayload> = {}): IMercadoPagoWebhookPayload => ({
    action: "payment.updated",
    api_version: "v1",
    data: { id: "12345" },
    date_created: "2026-06-27T00:00:00Z",
    id: "webhook-id",
    live_mode: false,
    type: "payment",
    user_id: 1,
    ...overrides,
  });

  let mpClientMock: { consultPayment: jest.Mock };
  let createMpClientSpy: jest.SpyInstance;
  let donationFindOneSpy: jest.SpyInstance;
  let donationUpdateOneSpy: jest.SpyInstance;
  let memberModelFindByIdSpy: jest.SpyInstance;
  let sendPushSpy: jest.SpyInstance;

  beforeEach(() => {
    mpClientMock = { consultPayment: jest.fn().mockResolvedValue(mockDonationPaymentData) };
    createMpClientSpy = jest
      .spyOn(mercadopagoIntegration, "createMercadoPagoClient")
      .mockResolvedValue(mpClientMock as any);

    donationFindOneSpy = jest
      .spyOn(DonationModel, "findOne")
      .mockResolvedValue(mockDonation as any);

    donationUpdateOneSpy = jest
      .spyOn(DonationModel, "updateOne")
      .mockResolvedValue({} as any);

    memberModelFindByIdSpy = jest
      .spyOn(MemberModel, "findById")
      .mockResolvedValue({ _id: "member-1", pushToken: "token-abc" } as any);

    sendPushSpy = jest
      .spyOn(firebaseIntegration, "sendPushNotificationToTokens")
      .mockResolvedValue([]);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should route to donation flow when external_reference is 'donation'", async () => {
    await processMercadoPagoWebhook(makePayload());

    expect(donationFindOneSpy).toHaveBeenCalledWith(
      { transactionId: "12345" },
      {},
      expect.objectContaining({ lean: true }),
    );
  });

  it("should NOT touch ChargeModel when processing a donation webhook", async () => {
    const chargeModelFindOneSpy = jest
      .spyOn(ChargeModel, "findOne")
      .mockResolvedValue(null as any);

    await processMercadoPagoWebhook(makePayload());

    expect(chargeModelFindOneSpy).not.toHaveBeenCalled();
  });

  it("should update donation status and statusDetail", async () => {
    await processMercadoPagoWebhook(makePayload());

    expect(donationUpdateOneSpy).toHaveBeenCalledWith(
      { transactionId: "12345" },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: TRANSACTION_STATUS.APPROVED,
          statusDetail: "accredited",
          dateApproved: mockDonationPaymentData.date_approved,
        }),
      }),
    );
  });

  it("should strip qr code data after a terminal status to save space", async () => {
    await processMercadoPagoWebhook(makePayload());

    expect(donationUpdateOneSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        $unset: {
          "transactionData.qrCodeBase64": "",
          "transactionData.qrCode": "",
          "transactionData.ticketUrl": "",
        },
      }),
    );
  });

  it("should send push notification to the member when donation is approved", async () => {
    await processMercadoPagoWebhook(makePayload());

    expect(sendPushSpy).toHaveBeenCalledWith(
      ["token-abc"],
      "Pagamento confirmado!",
      expect.any(String),
      expect.objectContaining({
        type: "PAYMENT_CONFIRMED",
        transactionId: "12345",
      }),
    );
  });

  it("should not send notification when donation is not approved (e.g. rejected)", async () => {
    mpClientMock.consultPayment.mockResolvedValue({
      ...mockDonationPaymentData,
      status: TRANSACTION_STATUS.REJECTED,
    });
    donationFindOneSpy.mockResolvedValue({ ...mockDonation, status: TRANSACTION_STATUS.PENDING });

    await processMercadoPagoWebhook(makePayload());

    expect(sendPushSpy).not.toHaveBeenCalled();
  });

  it("should not send notification when member has no pushToken", async () => {
    memberModelFindByIdSpy.mockResolvedValue({ _id: "member-1", pushToken: null } as any);

    await processMercadoPagoWebhook(makePayload());

    expect(sendPushSpy).not.toHaveBeenCalled();
  });

  it("should skip update when donation is not found", async () => {
    donationFindOneSpy.mockResolvedValue(null);

    await processMercadoPagoWebhook(makePayload());

    expect(donationUpdateOneSpy).not.toHaveBeenCalled();
  });

  it("should skip update when donation status is already the same", async () => {
    donationFindOneSpy.mockResolvedValue({
      ...mockDonation,
      status: TRANSACTION_STATUS.APPROVED,
    });

    await processMercadoPagoWebhook(makePayload());

    expect(donationUpdateOneSpy).not.toHaveBeenCalled();
  });
});
