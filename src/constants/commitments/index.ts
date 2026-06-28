// Limites de tamanho dos campos do compromisso (Quadro de Avisos).
const MAX_COMMITMENT_TITLE_LENGTH = 80;
const MAX_COMMITMENT_DAY_LENGTH = 40;
const MAX_COMMITMENT_TIME_LENGTH = 20;
const MAX_COMMITMENT_LOCATION_LENGTH = 120;

// Modos de repetição definidos pelo admin. O agent mensal usa esta flag para
// decidir o que fazer na virada de mês:
//   WEEKLY  -> recorrente toda semana; persiste (sem data específica).
//   MONTHLY -> N-ésima ocorrência do mês (ex.: 2º domingo); o agent re-data.
//   ONCE    -> data única; o agent apaga depois que a data passa.
const COMMITMENT_REPEAT = {
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  ONCE: "once",
} as const;

const COMMITMENT_REPEAT_VALUES = Object.values(COMMITMENT_REPEAT);

// Índices alinhados a Date#getUTCDay() (0=Domingo ... 6=Sábado).
const WEEKDAY = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

// Ordinais aceitos para o modo MONTHLY ("last" = última ocorrência do mês).
const COMMITMENT_ORDINAL_VALUES = [1, 2, 3, 4, 5, "last"];

export {
  MAX_COMMITMENT_TITLE_LENGTH,
  MAX_COMMITMENT_DAY_LENGTH,
  MAX_COMMITMENT_TIME_LENGTH,
  MAX_COMMITMENT_LOCATION_LENGTH,
  COMMITMENT_REPEAT,
  COMMITMENT_REPEAT_VALUES,
  COMMITMENT_ORDINAL_VALUES,
  WEEKDAY,
};
