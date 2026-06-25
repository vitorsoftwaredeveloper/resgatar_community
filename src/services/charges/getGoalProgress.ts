import { ContributionModel } from "../../models/Contribution";
import { MemberModel } from "../../models/Member";
import { MONTH_KEYS } from "../../constants/charges";
import { STATUS_CODE } from "../../constants";

interface IGoalProgress {
  year: number;
  month: number;
  goal: number;
  collected: number;
  remaining: number;
  percent: number;
}

const parseAmount = (value?: string | null): number => {
  if (!value) return 0;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

export const getGoalProgressService = async (
  year: number,
  month: number,
): Promise<IGoalProgress> => {
  console.log("IN - getGoalProgressService");

  try {
    const monthKey = MONTH_KEYS[month - 1];
    if (!monthKey) {
      throw {
        message: "Invalid month",
        statusCode: STATUS_CODE.BAD_REQUEST,
      };
    }

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
      { "paymentInfo.amount": 1 },
      { lean: true },
    );

    const amountMap = new Map(
      members.map((m: any) => [m._id, parseAmount(m.paymentInfo?.amount)]),
    );

    let goal = 0;
    let collected = 0;

    for (const contribution of expected) {
      const memberAmount = amountMap.get(contribution.memberId) ?? 0;
      if (memberAmount === 0) continue;

      const monthData: any = contribution.months[monthKey];

      if (monthData.paid) {
        // For paid months, use the value recorded at payment time so that
        // later edits to paymentInfo.amount don't distort historical totals.
        const paidValue = monthData.value
          ? parseAmount(monthData.value)
          : memberAmount;
        goal += paidValue;
        collected += paidValue;
      } else {
        goal += memberAmount;
      }
    }

    goal = round2(goal);
    collected = round2(collected);
    const remaining = Math.max(round2(goal - collected), 0);
    const percent = goal > 0 ? round2((collected / goal) * 100) : 0;

    return { year, month, goal, collected, remaining, percent };
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - getGoalProgressService");
  }
};
