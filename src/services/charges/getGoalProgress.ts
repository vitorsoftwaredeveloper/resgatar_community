import { ContributionModel } from "../../models/Contribution";
import { MemberModel } from "../../models/Member";
import { DonationModel } from "../../models/Donation";
import { ExpenseModel } from "../../models/Expense";
import { MonthlyGoalModel } from "../../models/MonthlyGoal";
import {
  MONTH_KEYS,
  TRANSACTION_STATUS,
  DEFAULT_MONTHLY_GOAL,
} from "../../constants/charges";
import { STATUS_CODE } from "../../constants";
import { IExpenseDTO } from "../../types/expenses";

// DTO enxuto para exibir a doação na tela de meta (sem QR code / dados de MP).
interface IGoalDonationItem {
  transactionId: string;
  donorName?: string;
  amount: string;
  paymentMethodId: string;
  dateApproved?: string | Date;
}

interface IGoalProgress {
  year: number;
  month: number;
  // Meta-alvo do mês, definida por um admin. Se ninguém definiu, cai no
  // DEFAULT_MONTHLY_GOAL (fallback só-de-leitura, não persistido).
  targetGoal: number;
  // Valor que conta para bater a meta: contribuições pagas + doações aprovadas.
  // Despesas NÃO entram aqui.
  achieved: number;
  // Meta batida quando o arrecadado atinge o alvo.
  goalReached: boolean;
  // Progresso rumo à meta (achieved / targetGoal), em %.
  achievedPercent: number;
  // Total devido pelos colaboradores no mês (pagos + pendentes).
  dues: number;
  // Arrecadado das contribuições (o que foi efetivamente pago).
  collected: number;
  // Doações avulsas aprovadas do mês.
  donations: number;
  // Despesas lançadas no mês (informativo, fora do cálculo da meta).
  expenses: number;
  // Quanto falta arrecadar para bater a meta (targetGoal − achieved), nunca
  // negativo.
  remaining: number;
  // Lançamentos que compõem os totais acima, para detalhamento no front.
  donationItems: IGoalDonationItem[];
  expenseItems: IExpenseDTO[];
}

const toDonationItem = (donation: any): IGoalDonationItem => ({
  transactionId: donation.transactionId,
  donorName: donation.donorName ?? undefined,
  amount: donation.amount,
  paymentMethodId: donation.paymentMethodId,
  dateApproved: donation.dateApproved ?? undefined,
});

const toExpenseItem = (expense: any): IExpenseDTO => ({
  _id: expense._id?.toString(),
  description: expense.description,
  amount: expense.amount,
  category: expense.category,
  referenceMonth: expense.referenceMonth,
  referenceYear: expense.referenceYear,
  date: expense.date,
  note: expense.note ?? undefined,
  receiptKey: expense.receiptKey ?? undefined,
  adminId: expense.adminId,
});

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

    // Doações e despesas usam referenceMonth 0-indexado (0 = janeiro),
    // enquanto aqui month é 1-indexado (1 = janeiro).
    const referenceMonth = month - 1;

    const [contributions, donationDocs, expenseDocs, monthlyGoalDoc] =
      await Promise.all([
      ContributionModel.find(
        { year },
        { memberId: 1, [`months.${monthKey}`]: 1 },
        { lean: true },
      ),
      DonationModel.find(
        {
          referenceYear: year,
          referenceMonth,
          status: TRANSACTION_STATUS.APPROVED,
        },
        {
          transactionId: 1,
          donorName: 1,
          amount: 1,
          paymentMethodId: 1,
          dateApproved: 1,
        },
        { lean: true, sort: { dateApproved: -1, createdAt: -1 } },
      ),
      ExpenseModel.find(
        { referenceYear: year, referenceMonth },
        {},
        { lean: true, sort: { date: -1, createdAt: -1 } },
      ),
      MonthlyGoalModel.findOne(
        { referenceYear: year, referenceMonth },
        { amount: 1 },
        { lean: true },
      ),
    ]);

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

    let dues = 0;
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
        dues += paidValue;
        collected += paidValue;
      } else {
        dues += memberAmount;
      }
    }

    const donations = donationDocs.reduce(
      (sum: number, d: any) => sum + parseAmount(d.amount),
      0,
    );
    const expenses = expenseDocs.reduce(
      (sum: number, e: any) => sum + parseAmount(e.amount),
      0,
    );

    dues = round2(dues);
    collected = round2(collected);
    const roundedDonations = round2(donations);
    const roundedExpenses = round2(expenses);

    // Meta-alvo do admin; sem registro, usa o default (não persiste).
    const targetGoal = (monthlyGoalDoc as any)?.amount
      ? round2(parseAmount((monthlyGoalDoc as any).amount))
      : DEFAULT_MONTHLY_GOAL;

    // Só contribuições pagas + doações contam para bater a meta (despesas fora).
    const achieved = round2(collected + roundedDonations);
    const goalReached = achieved >= targetGoal;
    const achievedPercent =
      targetGoal > 0 ? round2((achieved / targetGoal) * 100) : 0;
    const remaining = Math.max(round2(targetGoal - achieved), 0);

    return {
      year,
      month,
      targetGoal,
      achieved,
      goalReached,
      achievedPercent,
      dues,
      collected,
      donations: roundedDonations,
      expenses: roundedExpenses,
      remaining,
      donationItems: donationDocs.map(toDonationItem),
      expenseItems: expenseDocs.map(toExpenseItem),
    };
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - getGoalProgressService");
  }
};
