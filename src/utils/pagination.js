export const paginate = (data, total, page = 1, limit = 10) => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

export const getPaginationParams = (page, limit) => {
  const currentPage = Math.max(1, page || 1);
  const currentLimit = Math.min(100, Math.max(1, limit || 10));
  const skip = (currentPage - 1) * currentLimit;

  return {
    skip,
    take: currentLimit,
    page: currentPage,
    limit: currentLimit,
  };
};
