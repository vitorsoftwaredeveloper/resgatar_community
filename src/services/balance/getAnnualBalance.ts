import { ExpenseModel } from "../../models/Expense";
import { IAnnualBalance, IAnnualBalanceMonth } from "../../types/balance";
import { getAnnualChargesSummaryService } from "../charges/getAnnualChargesSummary";
import { verifyAdmin } from "../helper";

const parseAmount = (value?: string | null): number => {
  if (!value) return 0;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

export const getAnnualBalanceService = async (
  adminId: string,
  year: number,
): Promise<IAnnualBalance> => {
  console.log("IN - getAnnualBalanceService");

  try {
    await verifyAdmin(adminId);

    // Entradas: reusa o annual summary de charges (fonte da verdade do que foi
    // efetivamente arrecadado por mês). Ele já aplica o corte year-to-date.
    const chargesAnnual = await getAnnualChargesSummaryService(adminId, year);
    const asOfMonth = chargesAnnual.asOfMonth;

    // Saídas: todas as despesas do ano, agrupadas por mês (referenceMonth é
    // 0-indexado: 0 = janeiro), respeitando o mesmo corte YTD.
    const expenses = await ExpenseModel.find(
      { referenceYear: year },
      {},
      { lean: true },
    );

    const saidasByMonth = new Array(12).fill(0); // índice 0..11 = mês 1..12
    const expensesByCategory: Record<string, number> = {};

    for (const expense of expenses) {
      const monthIndex = expense.referenceMonth; // 0-11
      if (monthIndex < 0 || monthIndex > 11) continue;
      if (monthIndex + 1 > asOfMonth) continue; // ignora meses além do corte

      const value = parseAmount(expense.amount);
      saidasByMonth[monthIndex] += value;
      expensesByCategory[expense.category] = round2(
        (expensesByCategory[expense.category] ?? 0) + value,
      );
    }

    let running = 0;
    let totalEntradas = 0;
    let totalSaidas = 0;

    const byMonth: IAnnualBalanceMonth[] = chargesAnnual.byMonth.map((slot) => {
      const entradas = round2(slot.collected);
      const saidas = round2(saidasByMonth[slot.month - 1]);
      const resultado = round2(entradas - saidas);
      running = round2(running + resultado);

      totalEntradas += entradas;
      totalSaidas += saidas;

      return {
        month: slot.month,
        entradas,
        saidas,
        resultado,
        saldoAcumulado: running,
      };
    });

    totalEntradas = round2(totalEntradas);
    totalSaidas = round2(totalSaidas);

    return {
      year,
      asOfMonth,
      totals: {
        entradas: totalEntradas,
        saidas: totalSaidas,
        resultado: round2(totalEntradas - totalSaidas),
        saldoFinal: running,
      },
      byMonth,
      expensesByCategory,
    };
  } catch (error) {
    throw error;
  } finally {
    console.log("OUT - getAnnualBalanceService");
  }
};
