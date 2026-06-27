import * as helperService from "../../../../src/services/helper";
import { DonationModel } from "../../../../src/models/Donation";
import { listDonationsService } from "../../../../src/services/donations/listDonations";

describe("listDonationsService (integration)", () => {
  let verifyAdminSpy: jest.SpyInstance;
  let findSpy: jest.SpyInstance;

  beforeEach(() => {
    verifyAdminSpy = jest
      .spyOn(helperService, "verifyAdmin")
      .mockResolvedValue(undefined);

    findSpy = jest
      .spyOn(DonationModel, "find")
      .mockResolvedValue([] as any);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should require admin access", async () => {
    await listDonationsService("admin-id", 2026);

    expect(verifyAdminSpy).toHaveBeenCalledWith("admin-id");
  });

  it("should list only approved donations, leaving pending/returned ones out", async () => {
    await listDonationsService("admin-id", 2026);

    expect(findSpy).toHaveBeenCalledWith(
      { referenceYear: 2026, status: "approved" },
      {},
      expect.objectContaining({ sort: { createdAt: -1 }, lean: true }),
    );
  });

  it("should return the donations found", async () => {
    const donations = [
      { transactionId: "cash-1", amount: "10,00", status: "approved" },
    ];
    findSpy.mockResolvedValue(donations as any);

    const result = await listDonationsService("admin-id", 2026);

    expect(result).toEqual(donations);
  });
});
