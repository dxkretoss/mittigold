import React from 'react';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { Pagination } from '../common/Pagination';
import { usePagination } from '../../hooks/usePagination';

export const OrdersTable = ({ orders = [] }) => {
  const {
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    paginatedData,
    goToPage,
    canPrev,
    canNext,
  } = usePagination(orders, 10);

  return (
    <div>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Distributor</th>
              <th>Qty</th>
              <th>Est. Delivery</th>
              <th>Transport</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((o) => (
                <tr key={o.id}>
                  <td className="mono">{o.id}</td>
                  <td>{o.dist}</td>
                  <td className="zoneword">{o.qty}</td>
                  <td className="zoneword">{o.eta}</td>
                  <td className="zoneword">{o.transport}</td>
                  <td>
                    <Badge type="order" variant={o.status} />
                  </td>
                </tr>
              ))
            ) : (
              <EmptyState message="No orders in this status" colSpan={6} />
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
