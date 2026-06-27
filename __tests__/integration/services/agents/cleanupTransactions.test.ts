import { ChargeModel } from "../../../../src/models/Charge";
import { DonationModel } from "../../../../src/models/Donation";
import { TRANSACTION_STATUS } from "../../../../src/constants/charges";
import { execute } from "../../../../src/services/agents/cleanupTransactions";

describe("cleanupTransactions agent (integration)", () => {
  let deleteManyChargesSpy: jest.SpyInstance;
  let deleteManyDonationsSpy: jest.SpyInstance;

  beforeEach(() => {
    deleteManyChargesSpy = jest
      .spyOn(ChargeModel, "deleteMany")
      .mockResolvedValue({ deletedCount: 3 } as any);

    deleteManyDonationsSpy = jest
      .spyOn(DonationModel, "deleteMany")
      .mockResolvedValue({ deletedCount: 2 } as any);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should delete charges with PENDING and REJECTED status", async () => {
    await execute();

    expect(deleteManyChargesSpy).toHaveBeenCalledWith({
      status: {
        $in: [TRANSACTION_STATUS.PENDING, TRANSACTION_STATUS.REJECTED],
      },
    });
  });

  it("should delete donations with PENDING and REJECTED status", async () => {
    await execute();

    expect(deleteManyDonationsSpy).toHaveBeenCalledWith({
      status: {
        $in: [TRANSACTION_STATUS.PENDING, TRANSACTION_STATUS.REJECTED],
      },
    });
  });

  it("should clean up both ledgers exactly once each", async () => {
    await execute();

    expect(deleteManyChargesSpy).toHaveBeenCalledTimes(1);
    expect(deleteManyDonationsSpy).toHaveBeenCalledTimes(1);
  });

  it("should not throw when a deleteMany fails", async () => {
    deleteManyDonationsSpy.mockRejectedValue(new Error("DB error"));

    await expect(execute()).resolves.not.toThrow();
  });
});
