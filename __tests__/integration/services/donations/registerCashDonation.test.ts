import * as helperService from "../../../../src/services/helper";
import { DonationModel } from "../../../../src/models/Donation";
import { registerCashDonationService } from "../../../../src/services/donations/registerCashDonation";
import { TRANSACTION_STATUS } from "../../../../src/constants/charges";

describe("registerCashDonationService (integration)", () => {
  let verifyAdminSpy: jest.SpyInstance;
  let findMemberByIdSpy: jest.SpyInstance;
  let insertOneSpy: jest.SpyInstance;

  beforeEach(() => {
    verifyAdminSpy = jest
      .spyOn(helperService, "verifyAdmin")
      .mockResolvedValue(undefined);

    findMemberByIdSpy = jest
      .spyOn(helperService, "findMemberById")
      .mockResolvedValue({ _id: "admin-1" } as any);

    insertOneSpy = jest
      .spyOn(DonationModel, "insertOne")
      .mockResolvedValue({} as any);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should reject non-admin callers", async () => {
    verifyAdminSpy.mockRejectedValue({ message: "Forbidden", statusCode: 403 });

    await expect(
      registerCashDonationService("regular-member", { amount: "20,00" }),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(insertOneSpy).not.toHaveBeenCalled();
  });

  it("should save donation with status APPROVED (cash bypasses payment gateway)", async () => {
    await registerCashDonationService("admin-1", { amount: "30,00" });

    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: TRANSACTION_STATUS.APPROVED,
        paymentMethodId: "cash",
        amount: "30,00",
        memberId: "admin-1",
      }),
    );
  });

  it("should generate a synthetic transactionId prefixed with 'cash-'", async () => {
    await registerCashDonationService("admin-1", { amount: "30,00" });

    const saved = insertOneSpy.mock.calls[0][0];
    expect(saved.transactionId).toMatch(/^cash-[0-9a-f-]{36}$/);
  });

  it("should default referenceMonth to the current month when not provided", async () => {
    const now = new Date();

    await registerCashDonationService("admin-1", { amount: "30,00" });

    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({ referenceMonth: now.getMonth() }),
    );
  });

  it("should use the provided referenceMonth when supplied", async () => {
    await registerCashDonationService("admin-1", {
      amount: "30,00",
      referenceMonth: 2, // março
    });

    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({ referenceMonth: 2 }),
    );
  });

  it("should trim donorName and store it", async () => {
    await registerCashDonationService("admin-1", {
      amount: "30,00",
      donorName: "  Pedro  ",
    });

    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({ donorName: "Pedro" }),
    );
  });

  it("should store donorName as undefined when not provided", async () => {
    await registerCashDonationService("admin-1", { amount: "30,00" });

    expect(insertOneSpy).toHaveBeenCalledWith(
      expect.objectContaining({ donorName: undefined }),
    );
  });

  it("should return the persisted DTO", async () => {
    const result = await registerCashDonationService("admin-1", { amount: "30,00" });

    expect(result.paymentMethodId).toBe("cash");
    expect(result.status).toBe(TRANSACTION_STATUS.APPROVED);
  });
});
