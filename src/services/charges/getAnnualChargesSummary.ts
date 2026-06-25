import { ContributionModel } from "../../models/Contribution";
import { MemberModel } from "../../models/Member";
import {
  CONTRIBUTION_PAYMENT_METHOD,
  MONTH_KEYS,
} from "../../constants/charges";
import {
  IAnnualByMember,
  IAnnualByMonth,
  IChargesAnnualSummary,
} from "../../types/charges";
import { verifyAdmin } from "../helper";

const parseAmount = (value?: string | null): number => {
  if (!value) return 0;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

// Year-to-date cutoff: for the current year only count up to the current
// month so future months do not inflate the goal; past years close all 12.
const resolveAsOfMonth = (year: number): number => {
  const now = new Date();
  const currentYear = now.getFullYear();

  if (year > currentYear) return 0;
  if (year < currentYear) return 12;
  return now.getMonth() + 1;
};

export const getAnnualChargesSummaryService = async (
  adminId: string,
  year: number,
): Promise<IChargesAnnualSummary> => {
  console.log("IN - getAnnualChargesSummaryService");

  try {
    await verifyAdmin(adminId);

    const asOfMonth = resolveAsOfMonth(year);

    const contributions = await ContributionModel.find(
      { year },
      { memberId: 1, months: 1 },
      { lean: true },
    );

    const memberIds = contributions.map((c: any) => c.memberId);

    const members = await MemberModel.find(
      { _id: { $in: memberIds } },
      {
        firstName: 1,
        lastName: 1,
        profileImage: 1,
        status: 1,
        "paymentInfo.amount": 1,
      },
      { lean: true },
    );

    const memberMap = new Map(members.map((m: any) => [m._id, m]));

    // Per-month accumulators, one slot per month up to the cutoff.
    const monthAcc: IAnnualByMonth[] = Array.from(
      { length: asOfMonth },
      (_, i) => ({
        month: i + 1,
        goal: 0,
        collected: 0,
        remaining: 0,
        percent: 0,
        counts: { paid: 0, pending: 0, total: 0 },
        byMethod: { pix: 0, cash: 0 },
      }),
    );

    const memberAccMap = new Map<string, IAnnualByMember>();

    for (const contribution of contributions) {
      const member: any = memberMap.get(contribution.memberId);
      // Contribution exists but member was removed: skip from the summary.
      if (!member) continue;

      const memberAmount = parseAmount(member.paymentInfo?.amount);

      const memberAcc: IAnnualByMember = {
        id: member._id,
        name: `${member.firstName} ${member.lastName}`.trim(),
        photo: member.profileImage ?? null,
        status: member.status,
        monthsPaid: 0,
        monthsPending: 0,
        totalPaid: 0,
        totalDue: 0,
        byMethod: { pix: 0, cash: 0 },
      };

      for (let month = 1; month <= asOfMonth; month++) {
        const monthKey = MONTH_KEYS[month - 1];
        const monthData: any = contribution.months?.[monthKey];

        // Member is only "expected" to pay months that exist in their
        // contribution doc (handles mid-year joins, where past months are
        // simply absent).
        if (!monthData) continue;

        const slot = monthAcc[month - 1];
        slot.counts.total += 1;

        if (monthData.paid) {
          // For paid months use the value recorded at payment time so later
          // edits to paymentInfo.amount don't distort historical totals.
          const paidValue = monthData.value
            ? parseAmount(monthData.value)
            : memberAmount;

          slot.goal += paidValue;
          slot.collected += paidValue;
          slot.counts.paid += 1;

          memberAcc.monthsPaid += 1;
          memberAcc.totalPaid += paidValue;

          if (monthData.paymentMethod === CONTRIBUTION_PAYMENT_METHOD.PIX) {
            slot.byMethod.pix += paidValue;
            memberAcc.byMethod.pix += paidValue;
          } else if (
            monthData.paymentMethod === CONTRIBUTION_PAYMENT_METHOD.CASH
          ) {
            slot.byMethod.cash += paidValue;
            memberAcc.byMethod.cash += paidValue;
          }
        } else {
          slot.goal += memberAmount;
          slot.counts.pending += 1;

          memberAcc.monthsPending += 1;
          memberAcc.totalDue += memberAmount;
        }
      }

      memberAccMap.set(member._id, memberAcc);
    }

    let totalGoal = 0;
    let totalCollected = 0;
    let totalPix = 0;
    let totalCash = 0;
    let totalPaid = 0;
    let totalPending = 0;

    for (const slot of monthAcc) {
      totalGoal += slot.goal;
      totalCollected += slot.collected;
      totalPix += slot.byMethod.pix;
      totalCash += slot.byMethod.cash;
      totalPaid += slot.counts.paid;
      totalPending += slot.counts.pending;

      slot.goal = round2(slot.goal);
      slot.collected = round2(slot.collected);
      slot.remaining = Math.max(round2(slot.goal - slot.collected), 0);
      slot.percent = slot.goal > 0 ? round2((slot.collected / slot.goal) * 100) : 0;
      slot.byMethod.pix = round2(slot.byMethod.pix);
      slot.byMethod.cash = round2(slot.byMethod.cash);
    }

    const byMember = Array.from(memberAccMap.values())
      .map((m) => ({
        ...m,
        totalPaid: round2(m.totalPaid),
        totalDue: round2(m.totalDue),
        byMethod: {
          pix: round2(m.byMethod.pix),
          cash: round2(m.byMethod.cash),
        },
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    totalGoal = round2(totalGoal);
    totalCollected = round2(totalCollected);

    return {
      year,
      asOfMonth,
      totals: {
        goal: totalGoal,
        collected: totalCollected,
        remaining: Math.max(round2(totalGoal - totalCollected), 0),
        percent: totalGoal > 0 ? round2((totalCollected / totalGoal) * 100) : 0,
        byMethod: { pix: round2(totalPix), cash: round2(totalCash) },
        counts: { paid: totalPaid, pending: totalPending },
      },
      byMonth: monthAcc,
      byMember,
    };
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - getAnnualChargesSummaryService");
  }
};
