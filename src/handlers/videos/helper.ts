import { STATUS_CODE } from "../../constants";

interface Pagination {
  page: number;
  limit: number;
}

interface VideoFilters {
  title?: string;
  memberId?: string;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

// Lê page/limit dos query params, com defaults, validando os valores quando informados.
export const parsePagination = (
  queryStringParameters: Record<string, string | undefined> | null,
): Pagination => {
  const rawPage = queryStringParameters?.page;
  const rawLimit = queryStringParameters?.limit;

  const page = rawPage !== undefined ? Number(rawPage) : DEFAULT_PAGE;
  const limit = rawLimit !== undefined ? Number(rawLimit) : DEFAULT_LIMIT;

  if (!Number.isInteger(page) || page < 1) {
    throw {
      statusCode: STATUS_CODE.BAD_REQUEST,
      message: "Query param 'page' inválido.",
    };
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw {
      statusCode: STATUS_CODE.BAD_REQUEST,
      message: `Query param 'limit' inválido (1-${MAX_LIMIT}).`,
    };
  }

  return { page, limit };
};

// Lê title/memberId dos query params para filtrar a listagem de vídeos.
export const parseVideoFilters = (
  queryStringParameters: Record<string, string | undefined> | null,
): VideoFilters => {
  const title = queryStringParameters?.title?.trim();
  const memberId = queryStringParameters?.memberId?.trim();

  return {
    ...(title && { title }),
    ...(memberId && { memberId }),
  };
};
