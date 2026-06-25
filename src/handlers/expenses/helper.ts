import { STATUS_CODE } from "../../constants";

interface YearMonth {
  year: number;
  month: number;
}

// Lê year (>=2000) e month (0-11) dos query params, validando ambos.
export const parseYearMonth = (
  queryStringParameters: Record<string, string | undefined> | null,
): YearMonth => {
  const year = Number(queryStringParameters?.year);
  const month = Number(queryStringParameters?.month);

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw {
      statusCode: STATUS_CODE.BAD_REQUEST,
      message: "Query param 'year' inválido.",
    };
  }

  if (!Number.isInteger(month) || month < 0 || month > 11) {
    throw {
      statusCode: STATUS_CODE.BAD_REQUEST,
      message: "Query param 'month' inválido (0-11).",
    };
  }

  return { year, month };
};
