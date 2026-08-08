import * as helperService from "../../../../src/services/helper";
import * as notificationEngine from "../../../../src/services/notifications/sendNotification";
import { ContributionModel } from "../../../../src/models/Contribution";
import { registerCashPaymentService } from "../../../../src/services/charges/registerCashPayment";
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

const ADMIN_ID = "admin-id";
const MEMBER_ID = "member-id-123";
const currentYear = new Date().getFullYear();

const callPayload = { memberId: MEMBER_ID, referenceMonth: 5 };

describe("registerCashPaymentService (integration)", () => {
  let verifyAdminSpy: jest.SpyInstance;
  let findMemberByIdSpy: jest.SpyInstance;
  let findOneSpy: jest.SpyInstance;
  let updateOneSpy: jest.SpyInstance;
  let sendNotificationSpy: jest.SpyInstance;

  beforeEach(() => {
    verifyAdminSpy = jest
      .spyOn(helperService, "verifyAdmin")
      .mockResolvedValue(undefined as any);

    findMemberByIdSpy = jest
      .spyOn(helperService, "findMemberById")
      .mockResolvedValue(mockMember);

    findOneSpy = jest
      .spyOn(ContributionModel, "findOne")
      .mockResolvedValue({
        months: { june: { paid: false } },
      } as any);

    updateOneSpy = jest
      .spyOn(ContributionModel, "updateOne")
      .mockResolvedValue({} as any);

    sendNotificationSpy = jest
      .spyOn(notificationEngine, "sendNotification")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should verify the caller is an admin", async () => {
    await registerCashPaymentService(ADMIN_ID, callPayload);

    expect(verifyAdminSpy).toHaveBeenCalledWith(ADMIN_ID);
  });

  it("should not touch contributions when caller is not an admin", async () => {
    verifyAdminSpy.mockRejectedValue({ statusCode: 401, message: "Unauthorized access" });

    await expect(
      registerCashPaymentService(ADMIN_ID, callPayload)
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(findMemberByIdSpy).not.toHaveBeenCalled();
    expect(updateOneSpy).not.toHaveBeenCalled();
  });

  it("should look up the target member from the payload", async () => {
    await registerCashPaymentService(ADMIN_ID, callPayload);

    expect(findMemberByIdSpy).toHaveBeenCalledWith(MEMBER_ID);
  });

  it("should set the target month as paid with cash method and member amount", async () => {
    await registerCashPaymentService(ADMIN_ID, callPayload);

    expect(updateOneSpy).toHaveBeenCalledWith(
      { memberId: MEMBER_ID, year: currentYear },
      expect.objectContaining({
        $set: expect.objectContaining({
          "months.june.paid": true,
          "months.june.value": "50,00",
          "months.june.paymentMethod": "cash",
        }),
      })
    );
  });

  it("should notify the target member after registering the payment", async () => {
    await registerCashPaymentService(ADMIN_ID, callPayload);

    expect(sendNotificationSpy).toHaveBeenCalledWith(
      [MEMBER_ID],
      expect.objectContaining({
        title: "Pagamento confirmado!",
        body: "Seu pagamento foi processado com sucesso.",
        data: expect.objectContaining({
          type: "PAYMENT_CONFIRMED",
          paymentMethod: "cash",
        }),
      })
    );
  });

  it("should return the registered payment summary", async () => {
    const result = await registerCashPaymentService(ADMIN_ID, callPayload);

    expect(result).toEqual(
      expect.objectContaining({
        referenceMonth: 5,
        year: currentYear,
        paid: true,
        value: "50,00",
        paymentMethod: "cash",
      })
    );
  });

  it("should throw 404 when contribution for the year does not exist", async () => {
    findOneSpy.mockResolvedValue(null);

    await expect(
      registerCashPaymentService(ADMIN_ID, callPayload)
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(updateOneSpy).not.toHaveBeenCalled();
  });

  it("should throw 404 when the month does not exist in the contribution", async () => {
    findOneSpy.mockResolvedValue({ months: {} } as any);

    await expect(
      registerCashPaymentService(ADMIN_ID, callPayload)
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(updateOneSpy).not.toHaveBeenCalled();
  });

  it("should throw 409 when the month is already paid and not notify", async () => {
    findOneSpy.mockResolvedValue({
      months: { june: { paid: true } },
    } as any);

    await expect(
      registerCashPaymentService(ADMIN_ID, callPayload)
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(updateOneSpy).not.toHaveBeenCalled();
    expect(sendNotificationSpy).not.toHaveBeenCalled();
  });

  it("should throw when target member is not found", async () => {
    findMemberByIdSpy.mockRejectedValue({
      statusCode: 404,
      message: "Member not found",
    });

    await expect(
      registerCashPaymentService(ADMIN_ID, callPayload)
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(findOneSpy).not.toHaveBeenCalled();
  });
});
