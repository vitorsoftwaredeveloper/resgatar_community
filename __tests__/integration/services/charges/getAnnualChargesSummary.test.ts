import * as helperService from "../../../../src/services/helper";
import { ContributionModel } from "../../../../src/models/Contribution";
import { MemberModel } from "../../../../src/models/Member";
import { getAnnualChargesSummaryService } from "../../../../src/services/charges/getAnnualChargesSummary";

const ADMIN_ID = "admin-id";
const PAST_YEAR = 2020;   // year < now → asOfMonth = 12
const FUTURE_YEAR = 9999; // year > now → asOfMonth = 0

const buildMember = (overrides: any = {}) => ({
  _id: "member-1",
  firstName: "João",
  lastName: "Silva",
  profileImage: null,
  status: "active",
  paymentInfo: { amount: "100,00" },
  ...overrides,
});

describe("getAnnualChargesSummaryService (integration)", () => {
  let verifyAdminSpy: jest.SpyInstance;
  let contributionFindSpy: jest.SpyInstance;
  let memberFindSpy: jest.SpyInstance;

  beforeEach(() => {
    verifyAdminSpy = jest
      .spyOn(helperService, "verifyAdmin")
      .mockResolvedValue(undefined as any);

    contributionFindSpy = jest
      .spyOn(ContributionModel, "find")
      .mockResolvedValue([] as any);

    memberFindSpy = jest
      .spyOn(MemberModel, "find")
      .mockResolvedValue([] as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  // --- admin guard ---

  it("should verify the caller is an admin", async () => {
    await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);

    expect(verifyAdminSpy).toHaveBeenCalledWith(ADMIN_ID);
  });

  it("should not query data when caller is not admin", async () => {
    verifyAdminSpy.mockRejectedValue({ statusCode: 401, message: "Unauthorized access" });

    await expect(
      getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR)
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(contributionFindSpy).not.toHaveBeenCalled();
    expect(memberFindSpy).not.toHaveBeenCalled();
  });

  // --- asOfMonth / year boundaries ---

  it("should return asOfMonth 12 for a past year", async () => {
    const result = await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);

    expect(result.asOfMonth).toBe(12);
    expect(result.year).toBe(PAST_YEAR);
  });

  it("should return asOfMonth 0 and empty arrays for a future year", async () => {
    const result = await getAnnualChargesSummaryService(ADMIN_ID, FUTURE_YEAR);

    expect(result.asOfMonth).toBe(0);
    expect(result.byMonth).toHaveLength(0);
    expect(result.byMember).toHaveLength(0);
  });

  it("should return asOfMonth equal to the current month for the current year", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-15T12:00:00.000Z")); // June = month 6

    const result = await getAnnualChargesSummaryService(ADMIN_ID, 2026);

    expect(result.asOfMonth).toBe(6);
    expect(result.byMonth).toHaveLength(6);
  });

  it("should query contributions filtered by year", async () => {
    await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);

    expect(contributionFindSpy).toHaveBeenCalledWith(
      { year: PAST_YEAR },
      { memberId: 1, months: 1 },
      { lean: true },
    );
  });

  // --- empty state ---

  it("should return zeroed totals when no contributions exist", async () => {
    const result = await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);

    expect(result.totals).toEqual({
      goal: 0,
      collected: 0,
      remaining: 0,
      percent: 0,
      byMethod: { pix: 0, cash: 0 },
      counts: { paid: 0, pending: 0 },
    });
    expect(result.byMember).toHaveLength(0);
    expect(result.byMonth).toHaveLength(12);
  });

  // --- totals aggregation ---

  it("should aggregate goal and collected across all paid months", async () => {
    contributionFindSpy.mockResolvedValue([
      {
        memberId: "m1",
        months: {
          january:  { paid: true, value: "100,00", paymentMethod: "pix",  paidAt: new Date() },
          february: { paid: true, value: "100,00", paymentMethod: "pix",  paidAt: new Date() },
        },
      },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "m1", paymentInfo: { amount: "100,00" } }),
    ] as any);

    const result = await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);

    expect(result.totals.goal).toBe(200);
    expect(result.totals.collected).toBe(200);
    expect(result.totals.remaining).toBe(0);
    expect(result.totals.percent).toBe(100);
  });

  it("should compute percent correctly when some months are pending", async () => {
    contributionFindSpy.mockResolvedValue([
      {
        memberId: "m1",
        months: {
          january:  { paid: true,  value: "100,00", paymentMethod: "pix", paidAt: new Date() },
          february: { paid: false },
        },
      },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "m1", paymentInfo: { amount: "100,00" } }),
    ] as any);

    const result = await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);

    expect(result.totals.goal).toBe(200);
    expect(result.totals.collected).toBe(100);
    expect(result.totals.remaining).toBe(100);
    expect(result.totals.percent).toBe(50);
  });

  it("should clamp remaining to zero when collected exceeds goal", async () => {
    contributionFindSpy.mockResolvedValue([
      {
        memberId: "m1",
        months: {
          january: { paid: true, value: "200,00", paymentMethod: "pix", paidAt: new Date() },
        },
      },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "m1", paymentInfo: { amount: "100,00" } }),
    ] as any);

    const result = await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);

    expect(result.totals.remaining).toBe(0);
  });

  it("should split totals.byMethod correctly across pix and cash", async () => {
    contributionFindSpy.mockResolvedValue([
      {
        memberId: "m1",
        months: {
          january:  { paid: true, value: "100,00", paymentMethod: "pix",  paidAt: new Date() },
          february: { paid: true, value: "60,00",  paymentMethod: "cash", paidAt: new Date() },
        },
      },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "m1", paymentInfo: { amount: "100,00" } }),
    ] as any);

    const result = await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);

    expect(result.totals.byMethod.pix).toBe(100);
    expect(result.totals.byMethod.cash).toBe(60);
  });

  it("should not add an unknown payment method to byMethod", async () => {
    contributionFindSpy.mockResolvedValue([
      {
        memberId: "m1",
        months: {
          january: { paid: true, value: "100,00", paymentMethod: "boleto", paidAt: new Date() },
        },
      },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "m1", paymentInfo: { amount: "100,00" } }),
    ] as any);

    const result = await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);

    expect(result.totals.collected).toBe(100);
    expect(result.totals.byMethod.pix).toBe(0);
    expect(result.totals.byMethod.cash).toBe(0);
  });

  // --- byMonth ---

  it("should produce one slot per month up to asOfMonth", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-03-10T00:00:00.000Z")); // March = month 3

    const result = await getAnnualChargesSummaryService(ADMIN_ID, 2026);

    expect(result.byMonth).toHaveLength(3);
    expect(result.byMonth.map((s) => s.month)).toEqual([1, 2, 3]);
  });

  it("should accumulate per-month goal, collected and counts across members", async () => {
    contributionFindSpy.mockResolvedValue([
      {
        memberId: "m1",
        months: {
          january:  { paid: true,  value: "100,00", paymentMethod: "pix",  paidAt: new Date() },
          february: { paid: false },
        },
      },
      {
        memberId: "m2",
        months: {
          january:  { paid: false },
          february: { paid: true,  value: "50,00",  paymentMethod: "cash", paidAt: new Date() },
        },
      },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "m1", paymentInfo: { amount: "100,00" } }),
      buildMember({ _id: "m2", firstName: "Ana", paymentInfo: { amount: "50,00" } }),
    ] as any);

    const result = await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);
    const jan = result.byMonth[0];
    const feb = result.byMonth[1];

    // January: m1 paid 100 (pix), m2 pending 50
    expect(jan.goal).toBe(150);
    expect(jan.collected).toBe(100);
    expect(jan.remaining).toBe(50);
    expect(jan.counts).toEqual({ paid: 1, pending: 1, total: 2 });
    expect(jan.byMethod).toEqual({ pix: 100, cash: 0 });

    // February: m1 pending 100, m2 paid 50 (cash)
    expect(feb.goal).toBe(150);
    expect(feb.collected).toBe(50);
    expect(feb.counts).toEqual({ paid: 1, pending: 1, total: 2 });
    expect(feb.byMethod).toEqual({ pix: 0, cash: 50 });
  });

  it("should set percent 0 for months where goal is 0", async () => {
    const result = await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);

    result.byMonth.forEach((slot) => expect(slot.percent).toBe(0));
  });

  // --- member edge cases ---

  it("should skip contributions whose member no longer exists", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "m1",    months: { january: { paid: false } } },
      { memberId: "ghost", months: { january: { paid: true, value: "100,00", paymentMethod: "pix", paidAt: new Date() } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "m1" }),
    ] as any);

    const result = await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);

    expect(result.byMember).toHaveLength(1);
    expect(result.byMember[0].id).toBe("m1");
    expect(result.totals.collected).toBe(0);
  });

  it("should skip absent month entries for a mid-year join", async () => {
    // m1 joined in March — january and february are intentionally absent
    contributionFindSpy.mockResolvedValue([
      {
        memberId: "m1",
        months: {
          march: { paid: true, value: "100,00", paymentMethod: "pix", paidAt: new Date() },
        },
      },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "m1", paymentInfo: { amount: "100,00" } }),
    ] as any);

    const result = await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);

    expect(result.byMonth[0].counts.total).toBe(0); // january
    expect(result.byMonth[1].counts.total).toBe(0); // february
    expect(result.byMonth[2].counts.paid).toBe(1);  // march
    expect(result.totals.collected).toBe(100);
  });

  // --- value resolution ---

  it("should use the recorded value at payment time, not the current member amount", async () => {
    // Member paid R$100 but later updated paymentInfo.amount to R$10
    contributionFindSpy.mockResolvedValue([
      {
        memberId: "m1",
        months: {
          january: { paid: true, value: "100,00", paymentMethod: "pix", paidAt: new Date() },
        },
      },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "m1", paymentInfo: { amount: "10,00" } }),
    ] as any);

    const result = await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);

    expect(result.totals.goal).toBe(100);
    expect(result.totals.collected).toBe(100);
    expect(result.byMember[0].totalPaid).toBe(100);
  });

  it("should fall back to memberAmount when a paid month has no recorded value", async () => {
    contributionFindSpy.mockResolvedValue([
      {
        memberId: "m1",
        months: {
          january: { paid: true, paymentMethod: "cash", paidAt: new Date() },
        },
      },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "m1", paymentInfo: { amount: "75,00" } }),
    ] as any);

    const result = await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);

    expect(result.totals.collected).toBe(75);
    expect(result.totals.byMethod.cash).toBe(75);
  });

  it("should use current memberAmount for goal when a month is pending", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "m1", months: { january: { paid: false } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "m1", paymentInfo: { amount: "80,00" } }),
    ] as any);

    const result = await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);

    expect(result.byMonth[0].goal).toBe(80);
    expect(result.byMonth[0].collected).toBe(0);
    expect(result.totals.counts).toMatchObject({ pending: 1, paid: 0 });
  });

  it("should treat null amount as zero contribution to goal", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "m1", months: { january: { paid: false } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "m1", paymentInfo: { amount: null } }),
    ] as any);

    const result = await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);

    expect(result.totals.goal).toBe(0);
    expect(result.byMonth[0].counts.total).toBe(1);
  });

  it("should treat non-numeric amount as zero contribution to goal", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "m1", months: { january: { paid: false } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "m1", paymentInfo: { amount: "invalid" } }),
    ] as any);

    const result = await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);

    expect(result.totals.goal).toBe(0);
  });

  // --- byMember ---

  it("should return byMember sorted alphabetically by name", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "m1", months: { january: { paid: false } } },
      { memberId: "m2", months: { january: { paid: false } } },
      { memberId: "m3", months: { january: { paid: false } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "m1", firstName: "Carlos", lastName: "Lima" }),
      buildMember({ _id: "m2", firstName: "Ana",    lastName: "Souza" }),
      buildMember({ _id: "m3", firstName: "Bruno",  lastName: "Costa" }),
    ] as any);

    const result = await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);

    expect(result.byMember.map((m) => m.name)).toEqual([
      "Ana Souza",
      "Bruno Costa",
      "Carlos Lima",
    ]);
  });

  it("should accumulate per-member monthsPaid, monthsPending, totalPaid, totalDue and byMethod", async () => {
    contributionFindSpy.mockResolvedValue([
      {
        memberId: "m1",
        months: {
          january:  { paid: true,  value: "100,00", paymentMethod: "pix",  paidAt: new Date() },
          february: { paid: true,  value: "100,00", paymentMethod: "cash", paidAt: new Date() },
          march:    { paid: false },
        },
      },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "m1", paymentInfo: { amount: "100,00" } }),
    ] as any);

    const result = await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);
    const member = result.byMember[0];

    expect(member.monthsPaid).toBe(2);
    expect(member.monthsPending).toBe(1);
    expect(member.totalPaid).toBe(200);
    expect(member.totalDue).toBe(100);
    expect(member.byMethod).toEqual({ pix: 100, cash: 100 });
  });

  it("should set photo to null when member has no profileImage", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "m1", months: { january: { paid: false } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "m1", profileImage: undefined }),
    ] as any);

    const result = await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);

    expect(result.byMember[0].photo).toBeNull();
  });

  // --- rounding ---

  it("should round all monetary values to 2 decimal places", async () => {
    contributionFindSpy.mockResolvedValue([
      {
        memberId: "m1",
        months: {
          january:  { paid: true, value: "33,33", paymentMethod: "pix", paidAt: new Date() },
          february: { paid: true, value: "33,33", paymentMethod: "pix", paidAt: new Date() },
          march:    { paid: true, value: "33,34", paymentMethod: "pix", paidAt: new Date() },
        },
      },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "m1", paymentInfo: { amount: "33,33" } }),
    ] as any);

    const result = await getAnnualChargesSummaryService(ADMIN_ID, PAST_YEAR);

    // 33.33 + 33.33 + 33.34 = 100.00
    expect(result.totals.collected).toBe(100);
    expect(result.totals.byMethod.pix).toBe(100);
  });
});
