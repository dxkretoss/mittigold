import React from 'react';
import { ChevronDown } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { Pagination } from '../common/Pagination';
import { usePagination } from '../../hooks/usePagination';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
];

export const OrdersTable = ({ orders = [], onStatusChange }) => {
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
                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                      <select
                        value={o.status}
                        onChange={(e) => onStatusChange && onStatusChange(o.id, e.target.value)}
                        className={`chip ${o.status}`}
                        style={{
                          cursor: 'pointer',
                          border: 'none',
                          outline: 'none',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          paddingRight: '22px',
                          fontSize: '11px',
                          fontWeight: 700,
                          fontFamily: 'inherit',
                          textTransform: 'capitalize',
                        }}
                        title="Click to change order status"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                            style={{ background: '#ffffff', color: '#1D2430' }}
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="w-3 h-3 pointer-events-none"
                        style={{
                          position: 'absolute',
                          right: '6px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          opacity: 0.65,
                        }}
                      />
                    </div>
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

