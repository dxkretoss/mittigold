import { useState, useMemo } from 'react';

export const usePagination = (data = [], initialPageSize = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Auto adjust current page if total pages change
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [data, validCurrentPage, pageSize]);

  const goToPage = (page) => {
    const p = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(p);
  };

  const nextPage = () => {
    if (validCurrentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (validCurrentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return {
    currentPage: validCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    canNext: validCurrentPage < totalPages,
    canPrev: validCurrentPage > 1,
  };
};
