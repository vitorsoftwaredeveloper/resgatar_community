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
});
