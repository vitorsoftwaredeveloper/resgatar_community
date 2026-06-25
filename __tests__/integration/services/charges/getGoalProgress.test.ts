import { ContributionModel } from "../../../../src/models/Contribution";
import { MemberModel } from "../../../../src/models/Member";
import { getGoalProgressService } from "../../../../src/services/charges/getGoalProgress";

const YEAR = 2026;
const MONTH = 6;

describe("getGoalProgressService (integration)", () => {
  let contributionFindSpy: jest.SpyInstance;
  let memberFindSpy: jest.SpyInstance;

  beforeEach(() => {
    contributionFindSpy = jest
      .spyOn(ContributionModel, "find")
      .mockResolvedValue([] as any);

    memberFindSpy = jest
      .spyOn(MemberModel, "find")
      .mockResolvedValue([] as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return zeroed progress when no contributions exist", async () => {
    const result = await getGoalProgressService(YEAR, MONTH);

    expect(result).toEqual({
      year: YEAR,
      month: MONTH,
      goal: 0,
      collected: 0,
      remaining: 0,
      percent: 0,
    });
  });

  it("should throw 400 for an invalid month", async () => {
    await expect(getGoalProgressService(YEAR, 13)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("should correctly calculate goal, collected, remaining and percent", async () => {
    contributionFindSpy.mockResolvedValue([
      {
        memberId: "m1",
        months: { june: { paid: true, value: "100,00", paymentMethod: "pix" } },
      },
      {
        memberId: "m2",
        months: { june: { paid: true, value: "50,00", paymentMethod: "cash" } },
      },
      { memberId: "m3", months: { june: { paid: false } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      { _id: "m1", paymentInfo: { amount: "100,00" } },
      { _id: "m2", paymentInfo: { amount: "50,00" } },
      { _id: "m3", paymentInfo: { amount: "75,00" } },
    ] as any);

    const result = await getGoalProgressService(YEAR, MONTH);

    expect(result.goal).toBe(225);
    expect(result.collected).toBe(150);
    expect(result.remaining).toBe(75);
    expect(result.percent).toBeCloseTo(66.67, 1);
  });

  it("should return percent 100 when all members have paid", async () => {
    contributionFindSpy.mockResolvedValue([
      {
        memberId: "m1",
        months: { june: { paid: true, value: "100,00", paymentMethod: "pix" } },
      },
    ] as any);

    memberFindSpy.mockResolvedValue([
      { _id: "m1", paymentInfo: { amount: "100,00" } },
    ] as any);

    const result = await getGoalProgressService(YEAR, MONTH);

    expect(result.percent).toBe(100);
    expect(result.remaining).toBe(0);
  });

  it("should clamp remaining at zero when collected exceeds goal", async () => {
    contributionFindSpy.mockResolvedValue([
      {
        memberId: "m1",
        months: { june: { paid: true, value: "200,00", paymentMethod: "pix" } },
      },
    ] as any);

    memberFindSpy.mockResolvedValue([
      { _id: "m1", paymentInfo: { amount: "100,00" } },
    ] as any);

    const result = await getGoalProgressService(YEAR, MONTH);

    expect(result.remaining).toBe(0);
  });

  it("should not expose member-level details", async () => {
    const result = await getGoalProgressService(YEAR, MONTH);

    expect(result).not.toHaveProperty("members");
    expect(result).not.toHaveProperty("byMethod");
    expect(result).not.toHaveProperty("counts");
  });

  it("should only count members that have the month in their contribution", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "m1", months: { june: { paid: false } } },
      { memberId: "m2", months: { may: { paid: true } } }, // no june -> excluded
    ] as any);

    memberFindSpy.mockResolvedValue([
      { _id: "m1", paymentInfo: { amount: "100,00" } },
    ] as any);

    const result = await getGoalProgressService(YEAR, MONTH);

    expect(result.goal).toBe(100);
  });

  it("should use paid value for goal when member later changes their amount", async () => {
    // Member paid R$100 in June, then changed paymentInfo.amount to R$10.
    // Goal must stay R$100 (historical), not R$10.
    contributionFindSpy.mockResolvedValue([
      { memberId: "m1", months: { june: { paid: true, value: "100,00", paymentMethod: "pix" } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      { _id: "m1", paymentInfo: { amount: "10,00" } },
    ] as any);

    const result = await getGoalProgressService(YEAR, MONTH);

    expect(result.goal).toBe(100);
    expect(result.collected).toBe(100);
    expect(result.remaining).toBe(0);
    expect(result.percent).toBe(100);
  });

  it("should skip contribution when member amount is null", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "m1", months: { june: { paid: false } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      { _id: "m1", paymentInfo: { amount: null } },
    ] as any);

    const result = await getGoalProgressService(YEAR, MONTH);

    expect(result.goal).toBe(0);
    expect(result.percent).toBe(0);
  });

  it("should skip contribution when member amount is non-numeric", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "m1", months: { june: { paid: false } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      { _id: "m1", paymentInfo: { amount: "invalid" } },
    ] as any);

    const result = await getGoalProgressService(YEAR, MONTH);

    expect(result.goal).toBe(0);
    expect(result.percent).toBe(0);
  });

  it("should skip contribution when member is not found in DB", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "ghost", months: { june: { paid: false } } },
      { memberId: "m1", months: { june: { paid: false } } },
    ] as any);

    // ghost is not returned by MemberModel.find
    memberFindSpy.mockResolvedValue([
      { _id: "m1", paymentInfo: { amount: "100,00" } },
    ] as any);

    const result = await getGoalProgressService(YEAR, MONTH);

    expect(result.goal).toBe(100);
  });

  it("should fall back to member amount when paid month has no value field", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "m1", months: { june: { paid: true, paymentMethod: "cash" } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      { _id: "m1", paymentInfo: { amount: "100,00" } },
    ] as any);

    const result = await getGoalProgressService(YEAR, MONTH);

    expect(result.collected).toBe(100);
    expect(result.percent).toBe(100);
  });

  it("should return year and month in the response", async () => {
    const result = await getGoalProgressService(2025, 3);

    expect(result.year).toBe(2025);
    expect(result.month).toBe(3);
  });
});
