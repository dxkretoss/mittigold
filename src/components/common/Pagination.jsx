import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  canPrev,
  canNext,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`flex items-center justify-between pt-4 mt-2 border-t border-line text-xs text-ink-soft ${className}`}>
      <div>
        Showing <span className="font-semibold text-ink">{startItem}</span> to{' '}
        <span className="font-semibold text-ink">{endItem}</span> of{' '}
        <span className="font-semibold text-ink">{totalItems}</span> entries
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canPrev}
          className={`px-2.5 py-1 rounded-lg border border-line flex items-center gap-1 font-medium transition-all ${
            canPrev
              ? 'bg-white hover:bg-slateBg text-navy cursor-pointer'
              : 'bg-slateBg/50 text-ink-faint cursor-not-allowed opacity-50'
          }`}
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>

        <div className="flex items-center gap-1 mx-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                currentPage === pageNum
                  ? 'bg-navy text-white shadow-sm'
                  : 'bg-white border border-line text-ink hover:bg-slateBg'
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canNext}
          className={`px-2.5 py-1 rounded-lg border border-line flex items-center gap-1 font-medium transition-all ${
            canNext
              ? 'bg-white hover:bg-slateBg text-navy cursor-pointer'
              : 'bg-slateBg/50 text-ink-faint cursor-not-allowed opacity-50'
          }`}
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
