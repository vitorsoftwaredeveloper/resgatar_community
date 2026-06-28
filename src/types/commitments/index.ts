// Modo de repetição (ver constants/commitments COMMITMENT_REPEAT).
type CommitmentRepeat = "weekly" | "monthly" | "once";

// Ordinal da ocorrência mensal: N-ésima do mês ou a última.
type CommitmentOrdinal = 1 | 2 | 3 | 4 | 5 | "last";

// Documento persistido. `date` é a data real da ocorrência — null no modo
// semanal (recorrente, sem data fixa) e preenchido em monthly/once. `weekday`
// e `ordinal` guardam a âncora da recorrência para o agent recalcular o mês.
interface ICommitment {
  _id: string;
  title: string;
  day: string;
  time: string;
  location: string;
  order: number;
  repeat: CommitmentRepeat;
  weekday: number | null;
  ordinal: CommitmentOrdinal | null;
  date: Date | null;
}

// Payload vindo do app. O cliente escolhe o modo e a âncora:
//   weekly  -> weekday (0-6)
//   monthly -> weekday (0-6) + ordinal (1-5 | "last")
//   once    -> date (ISO "YYYY-MM-DD")
// title/time/location são sempre obrigatórios.
interface ICreateCommitmentPayload {
  title: string;
  time: string;
  location: string;
  repeat: CommitmentRepeat;
  weekday?: number;
  ordinal?: CommitmentOrdinal;
  date?: string;
}

// Forma retornada ao app. `date` (ISO) é null no modo semanal; `repeat` deixa
// o front exibir "Toda Quarta" (weekly) ou a data concreta (monthly/once).
// `weekday`/`ordinal` expõem a âncora da recorrência para a edição reabrir
// fiel (ex.: "last" não vira numérico inferido pela data).
interface ICommitmentResponse {
  id: string;
  title: string;
  day: string;
  time: string;
  location: string;
  repeat: CommitmentRepeat;
  weekday: number | null;
  ordinal: CommitmentOrdinal | null;
  date: string | null;
}

export {
  CommitmentRepeat,
  CommitmentOrdinal,
  ICommitment,
  ICreateCommitmentPayload,
  ICommitmentResponse,
};
