export function paginate(page = 1, limit = 10) {
  const currentPage = page || 1;
  const currentLimit = limit || 10;

  return {
    skip: (currentPage - 1) * currentLimit,
    take: currentLimit,
    meta: (total: number) => ({
      total,
      page: currentPage,
      totalPages: Math.ceil(total / currentLimit),
      hasNextPage: currentPage < Math.ceil(total / currentLimit),
      hasPreviousPage: currentPage > 1,
    }),
  };
}
