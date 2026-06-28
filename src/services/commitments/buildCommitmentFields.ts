import { STATUS_CODE } from "../../constants";
import { COMMITMENT_REPEAT } from "../../constants/commitments";
import {
  CommitmentOrdinal,
  ICreateCommitmentPayload,
} from "../../types/commitments";
import { getNthWeekdayOfMonth, getWeekdayNamePtBr } from "../../utils/recurrence";

interface BuiltCommitmentFields {
  title: string;
  day: string;
  time: string;
  location: string;
  repeat: ICreateCommitmentPayload["repeat"];
  weekday: number | null;
  ordinal: CommitmentOrdinal | null;
  date: Date | null;
}

const badRequest = (message: string) => ({
  statusCode: STATUS_CODE.BAD_REQUEST,
  message,
});

// Resolve os campos derivados (data concreta e nome do dia) a partir da âncora
// que o admin enviou, validando que o payload é coerente com o modo escolhido.
// `reference` é a data-base usada para calcular a ocorrência mensal (o agent
// passa o 1º dia do mês alvo; na criação é "hoje").
export const buildCommitmentFields = (
  payload: ICreateCommitmentPayload,
  reference: Date = new Date(),
): BuiltCommitmentFields => {
  const base = {
    title: payload.title.trim(),
    time: payload.time.trim(),
    location: payload.location.trim(),
    repeat: payload.repeat,
  };

  if (payload.repeat === COMMITMENT_REPEAT.WEEKLY) {
    if (payload.weekday === undefined) {
      throw badRequest("weekday é obrigatório para repetição semanal.");
    }
    return {
      ...base,
      weekday: payload.weekday,
      ordinal: null,
      date: null,
      day: getWeekdayNamePtBr(payload.weekday),
    };
  }

  if (payload.repeat === COMMITMENT_REPEAT.MONTHLY) {
    if (payload.weekday === undefined || payload.ordinal === undefined) {
      throw badRequest(
        "weekday e ordinal são obrigatórios para repetição mensal.",
      );
    }
    const date = getNthWeekdayOfMonth(
      reference.getUTCFullYear(),
      reference.getUTCMonth(),
      payload.weekday,
      payload.ordinal,
    );
    return {
      ...base,
      weekday: payload.weekday,
      ordinal: payload.ordinal,
      date,
      day: getWeekdayNamePtBr(payload.weekday),
    };
  }

  // once
  if (!payload.date) {
    throw badRequest("date é obrigatório para compromisso avulso.");
  }
  const parsed = new Date(`${payload.date}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw badRequest("date inválida; use o formato YYYY-MM-DD.");
  }
  return {
    ...base,
    weekday: parsed.getUTCDay(),
    ordinal: null,
    date: parsed,
    day: getWeekdayNamePtBr(parsed.getUTCDay()),
  };
};
