import type { Paginated, PaginationQuery } from '@sweets/types';

export function pageArgs({ page, pageSize }: PaginationQuery) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function paginated<T>(items: T[], total: number, q: PaginationQuery): Paginated<T> {
  return { items, total, page: q.page, pageSize: q.pageSize };
}
