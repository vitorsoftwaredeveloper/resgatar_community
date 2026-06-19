import * as helperService from "../../../../src/services/helper";
import * as mercadopagoIntegration from "../../../../src/integrations/mercadopago";
import * as mongooseUtil from "../../../../src/utils/mongoose";
import { ChargeModel } from "../../../../src/models/Charge";
import { ContributionModel } from "../../../../src/models/Contribution";
import { consultChargeService } from "../../../../src/services/charges/consultCharge";
import { IChargeDTO } from "../../../../src/types/charges";

const mockMember = { _id: "member-id-123", email: "joao@email.com" };

const pendingCharge: IChargeDTO = {
  transactionId: 123456,
  memberId: "member-id-123",
  status: "pending",
  statusDetail: "pending_waiting_transfer",
  transactionAmount: "50,00",
  paymentMethodId: "pix",
  currencyId: "BRL",
  dateCreated: "2024-01-01T00:00:00.000Z",
  dateOfExpiration: "2024-01-02T00:00:00.000Z",
  payer: {
    firstName: "João",
    lastName: "Silva",
    email: "joao@email.com",
    identification: { type: "CPF", numberType: "ENC:mocked" },
  },
  transactionData: {
    qrCode: "qr-code-string",
    qrCodeBase64: "qr-code-base64",
    ticketUrl: "https://mpago.la/ticket",
  },
  referenceMonth: 5,
};

const approvedMPagoResponse = {
  id: 123456,
  status: "approved",
  status_detail: "accredited",
  date_approved: "2024-01-01T10:00:00.000Z",
  point_of_interaction: { transaction_data: {} },
};

describe("consultChargeService (integration)", () => {
  let findMemberByIdSpy: jest.SpyInstance;
  let findOneChargeSpy: jest.SpyInstance;
  let consultPaymentMock: jest.Mock;
  let createMercadoPagoClientSpy: jest.SpyInstance;
  let executeMongoTransactionSpy: jest.SpyInstance;
  let updateOneChargeSpy: jest.SpyInstance;
  let updateOneContributionSpy: jest.SpyInstance;

  beforeEach(() => {
    findMemberByIdSpy = jest
      .spyOn(helperService, "findMemberById")
      .mockResolvedValue(mockMember as any);

    findOneChargeSpy = jest
      .spyOn(ChargeModel, "findOne")
      .mockResolvedValue(pendingCharge as any);

    consultPaymentMock = jest.fn().mockResolvedValue(approvedMPagoResponse);

    createMercadoPagoClientSpy = jest
      .spyOn(mercadopagoIntegration, "createMercadoPagoClient")
      .mockResolvedValue({ consultPayment: consultPaymentMock } as any);

    updateOneChargeSpy = jest
      .spyOn(ChargeModel, "updateOne")
      .mockResolvedValue({} as any);

    updateOneContributionSpy = jest
      .spyOn(ContributionModel, "updateOne")
      .mockResolvedValue({} as any);

    executeMongoTransactionSpy = jest
      .spyOn(mongooseUtil, "executeMongoTransaction")
      .mockImplementation(async (fn) => fn({} as any));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should verify member exists before consulting", async () => {
    await consultChargeService("member-id-123", "123456");

    expect(findMemberByIdSpy).toHaveBeenCalledWith("member-id-123");
  });

  it("should find charge by transactionId", async () => {
    await consultChargeService("member-id-123", "123456");

    expect(findOneChargeSpy).toHaveBeenCalledWith({ transactionId: "123456" });
  });

  it("should throw 404 when charge is not found", async () => {
    findOneChargeSpy.mockResolvedValue(null);

    await expect(
      consultChargeService("member-id-123", "999")
    ).rejects.toMatchObject({ statusCode: 404, message: "Charge not found" });
  });

  it("should call MercadoPago consultPayment when charge is pending", async () => {
    await consultChargeService("member-id-123", "123456");

    expect(consultPaymentMock).toHaveBeenCalledWith("123456");
  });

  it("should NOT call MercadoPago when charge is already approved", async () => {
    findOneChargeSpy.mockResolvedValue({ ...pendingCharge, status: "approved" } as any);

    await consultChargeService("member-id-123", "123456");

    expect(consultPaymentMock).not.toHaveBeenCalled();
  });

  it("should update charge and contribution when status changed from pending to approved", async () => {
    await consultChargeService("member-id-123", "123456");

    expect(updateOneChargeSpy).toHaveBeenCalledWith(
      { transactionId: pendingCharge.transactionId },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: "approved",
          statusDetail: "accredited",
        }),
      })
    );

    expect(updateOneContributionSpy).toHaveBeenCalledWith(
      expect.objectContaining({ memberId: pendingCharge.memberId }),
      expect.objectContaining({
        $set: expect.objectContaining({
          [`months.june.paid`]: true,
        }),
      })
    );
  });

  it("should NOT update when MercadoPago returns same status", async () => {
    consultPaymentMock.mockResolvedValue({ ...approvedMPagoResponse, status: "pending" });

    await consultChargeService("member-id-123", "123456");

    expect(updateOneChargeSpy).not.toHaveBeenCalled();
  });

  it("should return merged charge with updated status", async () => {
    const result = await consultChargeService("member-id-123", "123456");

    expect(result.status).toBe("approved");
  });

  it("should throw when member is not found", async () => {
    findMemberByIdSpy.mockRejectedValue({ statusCode: 404, message: "Member not found" });

    await expect(
      consultChargeService("unknown-id", "123456")
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(findOneChargeSpy).not.toHaveBeenCalled();
  });

  it("should throw when MercadoPago fails", async () => {
    consultPaymentMock.mockRejectedValue(new Error("MPago error"));

    await expect(
      consultChargeService("member-id-123", "123456")
    ).rejects.toThrow("MPago error");
  });
});
