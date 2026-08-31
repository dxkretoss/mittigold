import React from 'react';
import { initials } from '../../utils/helpers';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { Pagination } from '../common/Pagination';
import { usePagination } from '../../hooks/usePagination';

export const BrokersTable = ({ brokers = [] }) => {
  const {
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    paginatedData,
    goToPage,
    canPrev,
    canNext,
  } = usePagination(brokers, 10);

  return (
    <div>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Broker</th>
              <th>Total Orders</th>
              <th>Commission Earned</th>
              <th>Paid / Pending</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((b) => (
                <tr key={b.id || b.name}>
                  <td>
                    <div className="avatarname">
                      <div className="mini-av">{initials(b.name)}</div>
                      <div className="nm">{b.name}</div>
                    </div>
                  </td>
                  <td>{b.orders}</td>
                  <td className="amt">{b.commission}</td>
                  <td>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="chip paid">Paid {b.paid}</span>
                      {b.pending !== '₹0' && (
                        <span className="chip unpaid">Pending {b.pending}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyState message="No brokers found" colSpan={4} />
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={goToPage}
        canPrev={canPrev}
        canNext={canNext}
      />
    </div>
  );
};
