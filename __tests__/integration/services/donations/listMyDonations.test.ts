import { DonationModel } from "../../../../src/models/Donation";
import { listMyDonationsService } from "../../../../src/services/donations/listMyDonations";

describe("listMyDonationsService (integration)", () => {
  let findSpy: jest.SpyInstance;

  beforeEach(() => {
    findSpy = jest.spyOn(DonationModel, "find").mockResolvedValue([] as any);
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-15T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("should scope the query to the requester's own memberId and the current month/year, excluding returned donations", async () => {
    await listMyDonationsService("member-1");

    expect(findSpy).toHaveBeenCalledWith(
      {
        memberId: "member-1",
        referenceMonth: 5,
        referenceYear: 2026,
        status: { $nin: ["refunded", "charged_back"] },
      },
      {},
      expect.objectContaining({ sort: { createdAt: -1 }, lean: true }),
    );
  });

  it("should return the donations found", async () => {
    const donations = [
      { transactionId: "pix-1", amount: "20,00", status: "approved" },
    ];
    findSpy.mockResolvedValue(donations as any);

    const result = await listMyDonationsService("member-1");

    expect(result).toEqual(donations);
  });
});
