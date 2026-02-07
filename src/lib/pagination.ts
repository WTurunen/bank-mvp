export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type PaginatedResult<T> = {
  data: T[];
  pagination: PaginationMeta;
};

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function parsePaginationParams(
  searchParams: { page?: string; pageSize?: string }
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const rawPageSize = parseInt(searchParams.pageSize || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(Math.max(1, rawPageSize), MAX_PAGE_SIZE);
  return { page, pageSize };
}

export function calculatePaginationMeta(
  totalCount: number,
  params: PaginationParams
): PaginationMeta {
  const totalPages = Math.ceil(totalCount / params.pageSize);
  const page = Math.min(params.page, Math.max(1, totalPages));
  return {
    page,
    pageSize: params.pageSize,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function calculateSkipTake(params: PaginationParams): { skip: number; take: number } {
  return {
    skip: (params.page - 1) * params.pageSize,
    take: params.pageSize,
  };
}
