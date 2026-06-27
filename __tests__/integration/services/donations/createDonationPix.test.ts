import * as helperService from "../../../../src/services/helper";
import * as mercadopagoIntegration from "../../../../src/integrations/mercadopago";
import * as cryptoUtil from "../../../../src/utils/crypto";
import { DonationModel } from "../../../../src/models/Donation";
import { createDonationPixService } from "../../../../src/services/donations/createDonationPix";
import { TRANSACTION_STATUS } from "../../../../src/constants/charges";
import { IMember } from "../../../../src/types/members";

const mockMember: IMember = {
  _id: "member-1",
  firstName: "João",
  lastName: "Silva",
  email: "joao@example.com",
  identification: { type: "CPF", numberType: "encrypted-cpf" },
} as any;

const mockMpResponse = {
  id: 99001,
  status: TRANSACTION_STATUS.PENDING,
  status_detail: "pending_waiting_payment",
  currency_id: "BRL",
  date_created: "2026-06-27T10:00:00Z",
  date_of_expiration: "2026-06-28T10:00:00Z",
  external_reference: "donation",
  point_of_interaction: {
    transaction_data: {
      qr_code: "qr-code-string",
      qr_code_base64: "base64string",
      ticket_url: "https://mp.com/ticket/99001",
    },
  },
};

describe("createDonationPixService (integration)", () => {
  let findMemberByIdSpy: jest.SpyInstance;
  let mpClientMock: { createPayment: jest.Mock };
  let createMpClientSpy: jest.SpyInstance;
  let insertOneSpy: jest.SpyInstance;
  let decryptSpy: jest.SpyInstance;

  beforeEach(() => {
    findMemberByIdSpy = jest
      .spyOn(helperService, "findMemberById")
      .mockResolvedValue(mockMember);

    decryptSpy = jest
      .spyOn(cryptoUtil, "decrypt")
      .mockReturnValue("123.456.789-00");

    mpClientMock = { createPayment: jest.fn().mockResolvedValue(mockMpResponse) };
    createMpClientSpy = jest
      .spyOn(mercadopagoIntegration, "createMercadoPagoClient")
      .mockResolvedValue(mpClientMock as any);

    insertOneSpy = jest
      .spyOn(DonationModel, "insertOne")
      .mockResolvedValue({} as any);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should look up the member to get payer data", async () => {
    await createDonationPixService("member-1", { amount: "50,00" });

    expect(findMemberByIdSpy).toHaveBeenCalledWith("member-1");
  });

  it("should decrypt the member CPF before sending to Mercado Pago", async () => {
    await createDonationPixService("member-1", { amount: "50,00" });

    expect(decryptSpy).toHaveBeenCalledWith(mockMember.identification.numberType);
    expect(mpClientMock.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        payer: expect.objectContaining({
          identification: { type: "CPF", number: "123.456.789-00" },
        }),
      }),
    );
  });

  it("should send the amount as a number (comma replaced by dot) to Mercado Pago", async () => {
    await createDonationPixService("member-1", { amount: "150,99" });

    expect(mpClientMock.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({ transaction_amount: 150.99 }),
    );
  });

  it("should set external_reference to 'donation' so the webhook routes correctly", async () => {
    await createDonationPixService("member-1", { amount: "50,00" });

    expect(mpClientMock.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({ external_reference: "donation" }),
    );
  });

  it("should persist the donation with qr code data and return the DTO", async () => {
    const result = await createDonationPixService("member-1", {
      amount: "50,00",
      donorName: "  Maria  ",
    });

    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionId: String(mockMpResponse.id),
        memberId: "member-1",
        donorName: "Maria",
        amount: "50,00",
        paymentMethodId: "pix",
        status: TRANSACTION_STATUS.PENDING,
        transactionData: {
          qrCode: "qr-code-string",
          qrCodeBase64: "base64string",
          ticketUrl: "https://mp.com/ticket/99001",
        },
      }),
    );
    expect(result.transactionId).toBe(String(mockMpResponse.id));
    expect(result.transactionData?.qrCode).toBe("qr-code-string");
  });

  it("should store donorName as undefined when not provided", async () => {
    await createDonationPixService("member-1", { amount: "50,00" });

    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({ donorName: undefined }),
    );
  });

  it("should throw when member is not found", async () => {
    findMemberByIdSpy.mockRejectedValue({ message: "Member not found", statusCode: 404 });

    await expect(
      createDonationPixService("unknown", { amount: "50,00" }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("should throw when Mercado Pago call fails", async () => {
    mpClientMock.createPayment.mockRejectedValue(new Error("MP timeout"));

    await expect(
      createDonationPixService("member-1", { amount: "50,00" }),
    ).rejects.toThrow("MP timeout");

    expect(insertOneSpy).not.toHaveBeenCalled();
  });
});
