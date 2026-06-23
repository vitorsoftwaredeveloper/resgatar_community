import { ChargeModel } from "../../../../src/models/Charge";
import { TRANSACTION_STATUS } from "../../../../src/constants/charges";
import { execute } from "../../../../src/services/agents/removeCharges";

describe("removeCharges agent (integration)", () => {
  let deleteManyChargesSpy: jest.SpyInstance;

  beforeEach(() => {
    deleteManyChargesSpy = jest
      .spyOn(ChargeModel, "deleteMany")
      .mockResolvedValue({ deletedCount: 3 } as any);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should delete charges with PENDING status", async () => {
    await execute();

    expect(deleteManyChargesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: { $in: expect.arrayContaining([TRANSACTION_STATUS.PENDING]) },
      }),
    );
  });

  it("should delete charges with REJECTED status", async () => {
    await execute();

    expect(deleteManyChargesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: { $in: expect.arrayContaining([TRANSACTION_STATUS.REJECTED]) },
      }),
    );
  });

  it("should call deleteMany exactly once", async () => {
    await execute();

    expect(deleteManyChargesSpy).toHaveBeenCalledTimes(1);
  });

  it("should not throw when deleteMany fails", async () => {
    deleteManyChargesSpy.mockRejectedValue(new Error("DB error"));

    await expect(execute()).resolves.not.toThrow();
  });
});
