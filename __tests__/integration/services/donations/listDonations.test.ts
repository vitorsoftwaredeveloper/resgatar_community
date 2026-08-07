import { DonationModel } from "../../../../src/models/Donation";
import * as helperService from "../../../../src/services/helper";
import { listDonationsService } from "../../../../src/services/donations/listDonations";

describe("listDonationsService (integration)", () => {
  let findSpy: jest.SpyInstance;
  let verifyAdminSpy: jest.SpyInstance;

  beforeEach(() => {
    findSpy = jest
      .spyOn(DonationModel, "find")
      .mockResolvedValue([] as any);

    verifyAdminSpy = jest
      .spyOn(helperService, "verifyAdmin")
      .mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should require admin before listing", async () => {
    await listDonationsService("admin-id", 2026);

    expect(verifyAdminSpy).toHaveBeenCalledWith("admin-id");
  });

  it("should throw and not query when caller is not admin", async () => {
    verifyAdminSpy.mockRejectedValue({ statusCode: 401, message: "Unauthorized access" });

    await expect(listDonationsService("user-id", 2026)).rejects.toMatchObject({
      statusCode: 401,
    });

    expect(findSpy).not.toHaveBeenCalled();
  });

  it("should not filter donations by donor role, so guest donations are included", async () => {
    await listDonationsService("admin-id", 2026);

    expect(findSpy.mock.calls[0][0]).not.toHaveProperty("role");
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
