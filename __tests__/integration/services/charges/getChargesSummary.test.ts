import * as helperService from "../../../../src/services/helper";
import { ContributionModel } from "../../../../src/models/Contribution";
import { MemberModel } from "../../../../src/models/Member";
import { getChargesSummaryService } from "../../../../src/services/charges/getChargesSummary";

const ADMIN_ID = "admin-id";
const YEAR = 2026;
const MONTH = 6; // June (1-based) -> months.june

const buildMember = (overrides: any = {}) => ({
  _id: "member-1",
  firstName: "João",
  lastName: "Silva",
  profileImage: null,
  status: "active",
  role: "user",
  paymentInfo: { amount: "100,00" },
  ...overrides,
});

describe("getChargesSummaryService (integration)", () => {
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
  });

  it("should verify the caller is an admin", async () => {
    await getChargesSummaryService(ADMIN_ID, YEAR, MONTH);

    expect(verifyAdminSpy).toHaveBeenCalledWith(ADMIN_ID);
  });

  it("should not query data when caller is not an admin", async () => {
    verifyAdminSpy.mockRejectedValue({ statusCode: 401, message: "Unauthorized access" });

    await expect(
      getChargesSummaryService(ADMIN_ID, YEAR, MONTH)
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(contributionFindSpy).not.toHaveBeenCalled();
    expect(memberFindSpy).not.toHaveBeenCalled();
  });

  it("should throw 400 for an invalid month", async () => {
    await expect(
      getChargesSummaryService(ADMIN_ID, YEAR, 13)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("should aggregate goal, collected, remaining and counts", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "member-1", months: { june: { paid: true, value: "100,00", paymentMethod: "pix", paidAt: new Date() } } },
      { memberId: "member-2", months: { june: { paid: true, value: "50,00", paymentMethod: "cash", paidAt: new Date() } } },
      { memberId: "member-3", months: { june: { paid: false } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "member-1", paymentInfo: { amount: "100,00" } }),
      buildMember({ _id: "member-2", firstName: "Ana", paymentInfo: { amount: "50,00" } }),
      buildMember({ _id: "member-3", firstName: "Bruno", paymentInfo: { amount: "75,00" } }),
    ] as any);

    const result = await getChargesSummaryService(ADMIN_ID, YEAR, MONTH);

    expect(result.goal).toBe(225);
    expect(result.collected).toBe(150);
    expect(result.remaining).toBe(75);
    expect(result.byMethod).toEqual({ pix: 100, cash: 50 });
    expect(result.counts).toEqual({ paid: 2, pending: 1, total: 3 });
    expect(result.members).toHaveLength(3);
  });

  it("should clamp remaining at zero when collected exceeds goal", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "member-1", months: { june: { paid: true, value: "200,00", paymentMethod: "pix", paidAt: new Date() } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "member-1", paymentInfo: { amount: "100,00" } }),
    ] as any);

    const result = await getChargesSummaryService(ADMIN_ID, YEAR, MONTH);

    expect(result.remaining).toBe(0);
  });

  it("should only count members that have the month in their contribution", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "member-1", months: { june: { paid: false } } },
      { memberId: "member-2", months: { may: { paid: true } } }, // no june -> excluded
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "member-1" }),
    ] as any);

    const result = await getChargesSummaryService(ADMIN_ID, YEAR, MONTH);

    expect(result.counts.total).toBe(1);
  });

  it("should skip contributions whose member no longer exists", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "member-1", months: { june: { paid: false } } },
      { memberId: "ghost", months: { june: { paid: false } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "member-1" }),
    ] as any);

    const result = await getChargesSummaryService(ADMIN_ID, YEAR, MONTH);

    expect(result.counts.total).toBe(1);
    expect(result.members[0].id).toBe("member-1");
  });

  it("should fall back to member amount when paid month has no value", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "member-1", months: { june: { paid: true, paymentMethod: "cash", paidAt: new Date() } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "member-1", paymentInfo: { amount: "100,00" } }),
    ] as any);

    const result = await getChargesSummaryService(ADMIN_ID, YEAR, MONTH);

    expect(result.collected).toBe(100);
    expect(result.byMethod.cash).toBe(100);
  });

  it("should use paid value for goal and member amount when member later changes their amount", async () => {
    // Member paid R$100 in June, then changed paymentInfo.amount to R$10.
    // Both goal contribution and the member's displayed amount must be R$100.
    contributionFindSpy.mockResolvedValue([
      { memberId: "member-1", months: { june: { paid: true, value: "100,00", paymentMethod: "pix", paidAt: new Date() } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "member-1", paymentInfo: { amount: "10,00" } }),
    ] as any);

    const result = await getChargesSummaryService(ADMIN_ID, YEAR, MONTH);

    expect(result.goal).toBe(100);
    expect(result.collected).toBe(100);
    expect(result.remaining).toBe(0);
    expect(result.counts).toMatchObject({ paid: 1, pending: 0 });
    expect(result.members[0].amount).toBe(100);
  });

  it("should use current amount for goal when member has not yet paid", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "member-1", months: { june: { paid: false } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "member-1", paymentInfo: { amount: "10,00" } }),
    ] as any);

    const result = await getChargesSummaryService(ADMIN_ID, YEAR, MONTH);

    expect(result.goal).toBe(10);
    expect(result.collected).toBe(0);
    expect(result.remaining).toBe(10);
  });

  it("should treat member with null amount as zero contribution to goal", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "member-1", months: { june: { paid: false } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "member-1", paymentInfo: { amount: null } }),
    ] as any);

    const result = await getChargesSummaryService(ADMIN_ID, YEAR, MONTH);

    expect(result.goal).toBe(0);
    expect(result.counts.total).toBe(1);
  });

  it("should treat member with non-numeric amount as zero contribution to goal", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "member-1", months: { june: { paid: false } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "member-1", paymentInfo: { amount: "invalid" } }),
    ] as any);

    const result = await getChargesSummaryService(ADMIN_ID, YEAR, MONTH);

    expect(result.goal).toBe(0);
    expect(result.counts.total).toBe(1);
  });

  it("should not add to byMethod when payment method is unknown", async () => {
    contributionFindSpy.mockResolvedValue([
      {
        memberId: "member-1",
        months: { june: { paid: true, value: "100,00", paymentMethod: "boleto", paidAt: new Date() } },
      },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "member-1", paymentInfo: { amount: "100,00" } }),
    ] as any);

    const result = await getChargesSummaryService(ADMIN_ID, YEAR, MONTH);

    expect(result.collected).toBe(100);
    expect(result.byMethod.pix).toBe(0);
    expect(result.byMethod.cash).toBe(0);
  });

  it("should return members sorted alphabetically by name", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "m1", months: { june: { paid: false } } },
      { memberId: "m2", months: { june: { paid: false } } },
      { memberId: "m3", months: { june: { paid: false } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "m1", firstName: "Carlos", lastName: "Lima" }),
      buildMember({ _id: "m2", firstName: "Ana", lastName: "Souza" }),
      buildMember({ _id: "m3", firstName: "Bruno", lastName: "Costa" }),
    ] as any);

    const result = await getChargesSummaryService(ADMIN_ID, YEAR, MONTH);

    expect(result.members.map((m) => m.name)).toEqual([
      "Ana Souza",
      "Bruno Costa",
      "Carlos Lima",
    ]);
  });

  it("should include paidAt and method on paid members", async () => {
    const paidAt = new Date("2026-06-05T10:00:00.000Z");

    contributionFindSpy.mockResolvedValue([
      { memberId: "member-1", months: { june: { paid: true, value: "100,00", paymentMethod: "pix", paidAt } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "member-1", paymentInfo: { amount: "100,00" } }),
    ] as any);

    const result = await getChargesSummaryService(ADMIN_ID, YEAR, MONTH);
    const member = result.members[0];

    expect(member.paid).toBe(true);
    expect(member.method).toBe("pix");
    expect(member.paidAt).toEqual(paidAt);
  });

  it("should not include method or paidAt on unpaid members", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "member-1", months: { june: { paid: false } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "member-1" }),
    ] as any);

    const result = await getChargesSummaryService(ADMIN_ID, YEAR, MONTH);
    const member = result.members[0];

    expect(member.paid).toBe(false);
    expect(member.method).toBeUndefined();
    expect(member.paidAt).toBeUndefined();
  });

  it("should exclude an unpaid month from a member demoted back to guest", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "member-1", months: { june: { paid: false } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "member-1", role: "guest" }),
    ] as any);

    const result = await getChargesSummaryService(ADMIN_ID, YEAR, MONTH);

    expect(result.goal).toBe(0);
    expect(result.counts).toEqual({ paid: 0, pending: 0, total: 0 });
    expect(result.members).toHaveLength(0);
  });

  it("should keep a paid month from a member demoted back to guest", async () => {
    contributionFindSpy.mockResolvedValue([
      { memberId: "member-1", months: { june: { paid: true, value: "100,00", paymentMethod: "pix", paidAt: new Date() } } },
    ] as any);

    memberFindSpy.mockResolvedValue([
      buildMember({ _id: "member-1", role: "guest" }),
    ] as any);

    const result = await getChargesSummaryService(ADMIN_ID, YEAR, MONTH);

    expect(result.goal).toBe(100);
    expect(result.collected).toBe(100);
    expect(result.counts).toEqual({ paid: 1, pending: 0, total: 1 });
  });

  it("should return zeroed summary when no contributions exist for the month", async () => {
    const result = await getChargesSummaryService(ADMIN_ID, YEAR, MONTH);

    expect(result).toMatchObject({
      goal: 0,
      collected: 0,
      remaining: 0,
      byMethod: { pix: 0, cash: 0 },
      counts: { paid: 0, pending: 0, total: 0 },
      members: [],
    });
  });
});
