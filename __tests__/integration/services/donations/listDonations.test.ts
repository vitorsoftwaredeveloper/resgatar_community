import { DonationModel } from "../../../../src/models/Donation";
import { listDonationsService } from "../../../../src/services/donations/listDonations";

describe("listDonationsService (integration)", () => {
  let findSpy: jest.SpyInstance;

  beforeEach(() => {
    findSpy = jest
      .spyOn(DonationModel, "find")
      .mockResolvedValue([] as any);
  });

  afterEach(() => jest.restoreAllMocks());

  // A listagem de doações é aberta a qualquer membro autenticado (transparência
  // para a comunidade), então o service não faz verificação de admin.

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
