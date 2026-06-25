import { ContributionModel } from "../../models/Contribution";
import { MemberModel } from "../../models/Member";
import { STATUS_CODE } from "../../constants";
import {
  CONTRIBUTION_PAYMENT_METHOD,
  MONTH_KEYS,
} from "../../constants/charges";
import { IChargesSummary, IChargesSummaryMember } from "../../types/charges";
import { verifyAdmin } from "../helper";

const parseAmount = (value?: string | null): number => {
  if (!value) return 0;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

export const getChargesSummaryService = async (
  adminId: string,
  year: number,
  month: number,
): Promise<IChargesSummary> => {
  console.log("IN - getChargesSummaryService");

  try {
    await verifyAdmin(adminId);

    const monthKey = MONTH_KEYS[month - 1];
    if (!monthKey) {
      throw {
        message: "Invalid month",
        statusCode: STATUS_CODE.BAD_REQUEST,
      };
    }

    // One contribution doc per member per year. Only members that have this
    // month in their contribution are "expected" to pay it (handles mid-year
    // joins, where past months simply do not exist).
    const contributions = await ContributionModel.find(
      { year },
      { memberId: 1, [`months.${monthKey}`]: 1 },
      { lean: true },
    );

    const expected = contributions.filter(
      (c: any) => c.months && c.months[monthKey],
    );
    const memberIds = expected.map((c: any) => c.memberId);

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

    let goal = 0;
    let collected = 0;
    let pix = 0;
    let cash = 0;
    let paidCount = 0;
    const summaryMembers: IChargesSummaryMember[] = [];

    for (const contribution of expected) {
      const member: any = memberMap.get(contribution.memberId);
      // Contribution exists but member was removed: skip from the summary.
      if (!member) continue;

      const monthData: any = contribution.months[monthKey];
      const memberAmount = parseAmount(member.paymentInfo?.amount);

      if (monthData.paid) {
        // For paid months, use the value recorded at payment time so that
        // later edits to paymentInfo.amount don't distort historical totals.
        const paidValue = monthData.value
          ? parseAmount(monthData.value)
          : memberAmount;

        goal += paidValue;
        collected += paidValue;
        paidCount += 1;

        summaryMembers.push({
          id: member._id,
          name: `${member.firstName} ${member.lastName}`.trim(),
          photo: member.profileImage ?? null,
          status: member.status,
          paid: true,
          amount: paidValue,
          method: monthData.paymentMethod,
          paidAt: monthData.paidAt,
        });

        if (monthData.paymentMethod === CONTRIBUTION_PAYMENT_METHOD.PIX) {
          pix += paidValue;
        } else if (
          monthData.paymentMethod === CONTRIBUTION_PAYMENT_METHOD.CASH
        ) {
          cash += paidValue;
        }
      } else {
        goal += memberAmount;

        summaryMembers.push({
          id: member._id,
          name: `${member.firstName} ${member.lastName}`.trim(),
          photo: member.profileImage ?? null,
          status: member.status,
          paid: false,
          amount: memberAmount,
        });
      }

    }

    summaryMembers.sort((a, b) => a.name.localeCompare(b.name));

    const total = summaryMembers.length;

    return {
      year,
      month,
      goal: round2(goal),
      collected: round2(collected),
      remaining: Math.max(round2(goal - collected), 0),
      byMethod: { pix: round2(pix), cash: round2(cash) },
      counts: { paid: paidCount, pending: total - paidCount, total },
      members: summaryMembers,
    };
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - getChargesSummaryService");
  }
};
