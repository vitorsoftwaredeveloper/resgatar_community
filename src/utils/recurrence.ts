import { CommitmentOrdinal } from "../types/commitments";

// Nomes pt-BR alinhados ao índice de getUTCDay() (0=Domingo ... 6=Sábado).
const WEEKDAY_NAMES_PT_BR = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export const getWeekdayNamePtBr = (weekday: number): string =>
  WEEKDAY_NAMES_PT_BR[weekday] ?? "";

// Todas as datas de um weekday dentro do mês. O horário é fixado em 12:00 UTC
// para a data não "vazar" para o dia anterior quando exibida no fuso do Brasil.
const getWeekdayDatesInMonth = (
  year: number,
  monthIndex: number,
  weekday: number,
): Date[] => {
  const matches: Date[] = [];

  const cursor = new Date(Date.UTC(year, monthIndex, 1, 12, 0, 0));
  while (cursor.getUTCMonth() === monthIndex) {
    if (cursor.getUTCDay() === weekday) {
      matches.push(new Date(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return matches;
};

// Resolve a N-ésima ocorrência (ou a última) de um weekday no mês. Retorna null
// quando o ordinal não existe naquele mês (ex.: 5ª quarta num mês com só 4).
export const getNthWeekdayOfMonth = (
  year: number,
  monthIndex: number,
  weekday: number,
  ordinal: CommitmentOrdinal,
): Date | null => {
  const dates = getWeekdayDatesInMonth(year, monthIndex, weekday);

  if (ordinal === "last") {
    return dates.length > 0 ? dates[dates.length - 1] : null;
  }

  return dates[ordinal - 1] ?? null;
};
