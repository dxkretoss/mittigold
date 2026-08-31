import React from 'react';
import { ChevronDown, Edit2, Trash2 } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { Pagination } from '../common/Pagination';
import { usePagination } from '../../hooks/usePagination';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
];

function renderQtySummary(qtyStr, items) {
  if (!qtyStr) return '—';

  // If structured items exist and length > 1
  if (Array.isArray(items) && items.length > 1) {
    const first = `${items[0].qty} bags · ${items[0].name}${items[0].pack ? ` (${items[0].pack})` : ''}`;
    const extraCount = items.length - 1;
    const fullTooltip = items.map((it) => `${it.qty} bags · ${it.name} (${it.pack})`).join('\n');

    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }} title={fullTooltip}>
        <span>{first}</span>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '999px',
            background: 'var(--amber-bg)',
            color: 'var(--amber)',
            whiteSpace: 'nowrap',
            cursor: 'help',
          }}
          title={fullTooltip}
        >
          +{extraCount} more
        </span>
      </div>
    );
  }

  // If qtyStr is a comma-separated string of items
  if (typeof qtyStr === 'string') {
    const parts = qtyStr.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      const first = parts[0];
      const extraCount = parts.length - 1;
      const fullTooltip = parts.join('\n');

      return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }} title={fullTooltip}>
          <span>{first}</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '999px',
              background: 'var(--amber-bg)',
              color: 'var(--amber)',
              whiteSpace: 'nowrap',
              cursor: 'help',
            }}
            title={fullTooltip}
          >
            +{extraCount} more
          </span>
        </div>
      );
    }
  }

  return <span>{qtyStr}</span>;
}

export const OrdersTable = ({ orders = [], onStatusChange, onEdit, onDelete }) => {
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
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((o) => (
                <tr key={o.id}>
                  <td className="mono">{o.id}</td>
                  <td>{o.dist}</td>
                  <td className="zoneword">{renderQtySummary(o.qty, o.items)}</td>
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
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      {onEdit && (
                        <button
                          type="button"
                          className="icon-sm"
                          onClick={() => onEdit(o)}
                          title="Edit Order"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          className="icon-sm danger"
                          onClick={() => onDelete(o)}
                          title="Delete Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyState message="No orders in this status" colSpan={7} />
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

