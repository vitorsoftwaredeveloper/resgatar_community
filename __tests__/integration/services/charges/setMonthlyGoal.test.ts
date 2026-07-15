import * as helperService from "../../../../src/services/helper";
import { MonthlyGoalModel } from "../../../../src/models/MonthlyGoal";
import { setMonthlyGoalService } from "../../../../src/services/charges/setMonthlyGoal";
import { ISetMonthlyGoalPayload } from "../../../../src/types/charges";

const basePayload: ISetMonthlyGoalPayload = {
  year: 2026,
  month: 6,
  amount: "2500,00",
};

describe("setMonthlyGoalService (integration)", () => {
  let verifyAdminSpy: jest.SpyInstance;
  let updateOneSpy: jest.SpyInstance;

  beforeEach(() => {
    verifyAdminSpy = jest
      .spyOn(helperService, "verifyAdmin")
      .mockResolvedValue(undefined);

    updateOneSpy = jest
      .spyOn(MonthlyGoalModel, "updateOne")
      .mockResolvedValue({ acknowledged: true } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should verify the requester is an admin before saving", async () => {
    await setMonthlyGoalService("admin-id", { ...basePayload });

    expect(verifyAdminSpy).toHaveBeenCalledWith("admin-id");
  });

  it("should not save the goal when verifyAdmin rejects", async () => {
    verifyAdminSpy.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized access",
    });

    await expect(
      setMonthlyGoalService("not-admin", { ...basePayload }),
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(updateOneSpy).not.toHaveBeenCalled();
  });

  it("should upsert with a 0-indexed reference month and the admin id", async () => {
    await setMonthlyGoalService("admin-id", { ...basePayload });

    expect(updateOneSpy).toHaveBeenCalledWith(
      { referenceYear: 2026, referenceMonth: 5 },
      {
        $set: { amount: "2500,00", adminId: "admin-id" },
        $setOnInsert: { referenceYear: 2026, referenceMonth: 5 },
      },
      { upsert: true },
    );
  });
});
