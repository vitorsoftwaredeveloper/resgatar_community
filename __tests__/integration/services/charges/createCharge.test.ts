import * as helperService from "../../../../src/services/helper";
import * as mercadopagoIntegration from "../../../../src/integrations/mercadopago";
import * as cryptoUtil from "../../../../src/utils/crypto";
import { ChargeModel } from "../../../../src/models/Charge";
import { createChargeService } from "../../../../src/services/charges/createCharge";
import { IMember } from "../../../../src/types/members";

const mockMember: IMember = {
  _id: "member-id-123",
  email: "joao@email.com",
  phoneNumber: "11999999999",
  firstName: "João",
  lastName: "Silva",
  dateOfBirth: 946684800000,
  role: "user",
  status: "active",
  paymentInfo: { datePayment: 5, amount: "50,00" },
  identification: { type: "CPF", numberType: "ENC:encrypted-cpf" },
};

const mockMPagoResponse = {
  id: 123456,
  status: "pending",
  status_detail: "pending_waiting_transfer",
  payment_method_id: "pix",
  payment_type_id: "bank_transfer",
  currency_id: "BRL",
  date_created: "2024-01-01T00:00:00.000Z",
  date_approved: null,
  date_of_expiration: "2024-01-02T00:00:00.000Z",
  transaction_amount: 50.0,
  point_of_interaction: {
    transaction_data: {
      qr_code: "qr-code-string",
      qr_code_base64: "qr-code-base64",
      ticket_url: "https://mpago.la/ticket",
    },
  },
};

describe("createChargeService (integration)", () => {
  let findMemberByIdSpy: jest.SpyInstance;
  let createMercadoPagoClientSpy: jest.SpyInstance;
  let decryptSpy: jest.SpyInstance;
  let encryptSpy: jest.SpyInstance;
  let insertOneSpy: jest.SpyInstance;
  let createPaymentMock: jest.Mock;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = "a".repeat(64);

    findMemberByIdSpy = jest
      .spyOn(helperService, "findMemberById")
      .mockResolvedValue(mockMember);

    decryptSpy = jest
      .spyOn(cryptoUtil, "decrypt")
      .mockReturnValue("12345678900");

    encryptSpy = jest
      .spyOn(cryptoUtil, "encrypt")
      .mockReturnValue("ENC:mocked");

    createPaymentMock = jest.fn().mockResolvedValue(mockMPagoResponse);

    createMercadoPagoClientSpy = jest
      .spyOn(mercadopagoIntegration, "createMercadoPagoClient")
      .mockResolvedValue({ createPayment: createPaymentMock } as any);

    insertOneSpy = jest
      .spyOn(ChargeModel, "insertOne")
      .mockResolvedValue({} as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.ENCRYPTION_KEY;
  });

  it("should find member before creating charge", async () => {
    await createChargeService("member-id-123", { referenceMonth: 5 });

    expect(findMemberByIdSpy).toHaveBeenCalledWith("member-id-123");
  });

  it("should call MercadoPago createPayment with correct payer data", async () => {
    await createChargeService("member-id-123", { referenceMonth: 5 });

    expect(createPaymentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction_amount: 50.0,
        payment_method_id: "pix",
        payer: expect.objectContaining({
          identification: expect.objectContaining({
            number: "12345678900",
            type: "CPF",
          }),
          first_name: mockMember.firstName,
          last_name: mockMember.lastName,
        }),
      })
    );
  });

  it("should decrypt CPF before sending to MercadoPago", async () => {
    await createChargeService("member-id-123", { referenceMonth: 5 });

    expect(decryptSpy).toHaveBeenCalledWith(mockMember.identification.numberType);
  });

  it("should encrypt CPF before saving charge to DB", async () => {
    await createChargeService("member-id-123", { referenceMonth: 5 });

    expect(encryptSpy).toHaveBeenCalled();
    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        payer: expect.objectContaining({
          identification: expect.objectContaining({ numberType: "ENC:mocked" }),
        }),
      })
    );
  });

  it("should save charge with correct transactionId from MercadoPago", async () => {
    await createChargeService("member-id-123", { referenceMonth: 5 });

    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({ transactionId: mockMPagoResponse.id })
    );
  });

  it("should save charge with correct referenceMonth", async () => {
    await createChargeService("member-id-123", { referenceMonth: 3 });

    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({ referenceMonth: 3 })
    );
  });

  it("should return the chargeDTO", async () => {
    const result = await createChargeService("member-id-123", { referenceMonth: 5 });

    expect(result).toEqual(
      expect.objectContaining({
        transactionId: mockMPagoResponse.id,
        memberId: mockMember._id,
        status: mockMPagoResponse.status,
      })
    );
  });

  it("should NOT save to DB when MercadoPago fails", async () => {
    createPaymentMock.mockRejectedValue(new Error("MPago error"));

    await expect(
      createChargeService("member-id-123", { referenceMonth: 5 })
    ).rejects.toThrow("MPago error");

    expect(insertOneSpy).not.toHaveBeenCalled();
  });

  it("should throw when member is not found", async () => {
    findMemberByIdSpy.mockRejectedValue({ statusCode: 404, message: "Member not found" });

    await expect(
      createChargeService("unknown-id", { referenceMonth: 5 })
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(createPaymentMock).not.toHaveBeenCalled();
  });

  it("should charge the member's fixed paymentInfo amount, converted to float", async () => {
    findMemberByIdSpy.mockResolvedValue({
      ...mockMember,
      paymentInfo: { datePayment: 5, amount: "123,45" },
    });

    await createChargeService("member-id-123", { referenceMonth: 0 });

    expect(createPaymentMock).toHaveBeenCalledWith(
      expect.objectContaining({ transaction_amount: 123.45 })
    );
  });

  it("should ignore any client-provided amount and always use paymentInfo amount", async () => {
    await createChargeService("member-id-123", {
      referenceMonth: 5,
    } as any);

    expect(createPaymentMock).toHaveBeenCalledWith(
      expect.objectContaining({ transaction_amount: 50.0 })
    );
  });
});
