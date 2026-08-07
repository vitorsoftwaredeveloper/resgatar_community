import * as helperService from "../../../../src/services/helper";
import * as mercadopagoIntegration from "../../../../src/integrations/mercadopago";
import { ChargeModel } from "../../../../src/models/Charge";
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

describe("consultChargeService (integration)", () => {
  let findMemberByIdSpy: jest.SpyInstance;
  let findOneChargeSpy: jest.SpyInstance;
  let createMercadoPagoClientSpy: jest.SpyInstance;
  let verifyInternalMemberSpy: jest.SpyInstance;

  beforeEach(() => {
    findMemberByIdSpy = jest
      .spyOn(helperService, "findMemberById")
      .mockResolvedValue(mockMember as any);

    findOneChargeSpy = jest
      .spyOn(ChargeModel, "findOne")
      .mockResolvedValue(pendingCharge as any);

    createMercadoPagoClientSpy = jest
      .spyOn(mercadopagoIntegration, "createMercadoPagoClient")
      .mockResolvedValue({ consultPayment: jest.fn() } as any);

    verifyInternalMemberSpy = jest
      .spyOn(helperService, "verifyInternalMember")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should require an internal member before consulting", async () => {
    await consultChargeService("member-id-123", "123456");

    expect(verifyInternalMemberSpy).toHaveBeenCalledWith("member-id-123");
  });

  it("should throw and not read the charge when the caller is a guest", async () => {
    verifyInternalMemberSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    await expect(
      consultChargeService("guest-id-123", "123456"),
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(findOneChargeSpy).not.toHaveBeenCalled();
  });

  it("should verify member exists before consulting", async () => {
    await consultChargeService("member-id-123", "123456");

    expect(findMemberByIdSpy).toHaveBeenCalledWith("member-id-123");
  });

  it("should find charge by transactionId", async () => {
    await consultChargeService("member-id-123", "123456");

    expect(findOneChargeSpy).toHaveBeenCalledWith({ transactionId: "123456" }, {}, { lean: true });
  });

  it("should return charge data from DB", async () => {
    const result = await consultChargeService("member-id-123", "123456");

    expect(result).toEqual(pendingCharge);
  });

  it("should return charge with status as stored in DB without calling MercadoPago", async () => {
    findOneChargeSpy.mockResolvedValue({ ...pendingCharge, status: "approved" } as any);

    const result = await consultChargeService("member-id-123", "123456");

    expect(result.status).toBe("approved");
    expect(createMercadoPagoClientSpy).not.toHaveBeenCalled();
  });

  it("should never call MercadoPago regardless of charge status", async () => {
    await consultChargeService("member-id-123", "123456");

    expect(createMercadoPagoClientSpy).not.toHaveBeenCalled();
  });

  it("should throw 404 when charge is not found", async () => {
    findOneChargeSpy.mockResolvedValue(null);

    await expect(
      consultChargeService("member-id-123", "999")
    ).rejects.toMatchObject({ statusCode: 404, message: "Charge not found" });
  });

  it("should throw when member is not found", async () => {
    findMemberByIdSpy.mockRejectedValue({ statusCode: 404, message: "Member not found" });

    await expect(
      consultChargeService("unknown-id", "123456")
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(findOneChargeSpy).not.toHaveBeenCalled();
  });
});
