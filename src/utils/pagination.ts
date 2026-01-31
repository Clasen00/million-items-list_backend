import { PAGINATION } from "../config/constants";
import { PaginatedResponse, PaginationParams } from "../types";

export const parsePaginationParams = (query: PaginationParams) => {
  const offset = query.offset || PAGINATION.DEFAULT_OFFSET;
  const limit = query.limit || PAGINATION.DEFAULT_LIMIT;

  return { offset, limit };
};

export const createPaginationResponse = <T>(
  data: T[],
  offset: number,
  limit: number,
  total: number,
): PaginatedResponse<T> => {
  return {
    data,
    pagination: {
      offset,
      limit,
      total,
      hasMore: offset + limit < total,
    },
  };
};

export const paginateArray = <T>(
  array: T[],
  offset: number,
  limit: number,
): T[] => {
  return array.slice(offset, offset + limit);
};
