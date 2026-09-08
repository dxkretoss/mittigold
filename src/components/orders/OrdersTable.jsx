import React from 'react';
import { ChevronDown, Edit2, Trash2, Eye } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { Pagination } from '../common/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { computeOrderValue } from '../../utils/orderPriceHelper';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'delivered', label: 'Delivered' },
];

function getAllowedStatusOptions(currentStatus) {
  const norm = String(currentStatus || '').trim().toLowerCase();
  if (norm === 'pending') {
    return [
      { value: 'pending', label: 'Pending' },
      { value: 'approved', label: 'Approved' },
      { value: 'dispatched', label: 'Dispatched' },
    ];
  }
  if (norm === 'approved') {
    return [
      { value: 'approved', label: 'Approved' },
      { value: 'dispatched', label: 'Dispatched' },
    ];
  }
  if (norm === 'dispatched') {
    return [
      { value: 'dispatched', label: 'Dispatched' },
      { value: 'delivered', label: 'Delivered' },
      { value: 'approved', label: 'Approved' },
    ];
  }
  if (norm === 'delivered') {
    return [
      { value: 'delivered', label: 'Delivered' },
    ];
  }
  // Default fallback for any processed status: do NOT include pending
  return [
    { value: 'approved', label: 'Approved' },
    { value: 'dispatched', label: 'Dispatched' },
  ];
}

function renderQtySummary(order) {
  if (!order) return '—';
  const qtyStr = order.qty || '';
  const items = order.items;
  const originalQty = order.original_qty;
  const isAdjusted = Boolean(
    order.is_adjusted ||
    (originalQty &&
      String(originalQty).trim() &&
      String(originalQty).trim().toLowerCase() !== String(qtyStr).trim().toLowerCase())
  );

  let mainQty = qtyStr || '—';
  let extraBadge = null;
  let fullTooltip = qtyStr;

  if (Array.isArray(items) && items.length > 1) {
    mainQty = `${items[0].qty} bags · ${items[0].name}${items[0].pack ? ` (${items[0].pack})` : ''}`;
    const extraCount = items.length - 1;
    fullTooltip = items.map((it) => `${it.qty} bags · ${it.name} (${it.pack || ''})`).join('\n');
    extraBadge = (
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
    );
  } else if (typeof qtyStr === 'string' && qtyStr.includes(',')) {
    const parts = qtyStr.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      mainQty = parts[0];
      const extraCount = parts.length - 1;
      fullTooltip = parts.join('\n');
      extraBadge = (
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
      );
    }
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }} title={fullTooltip}>
      <span style={{ fontWeight: 500, color: 'var(--navy)' }}>{mainQty}</span>
      {extraBadge}
      {isAdjusted && (
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 700,
            background: 'var(--amber-bg)',
            color: 'var(--amber)',
            padding: '2px 7px',
            borderRadius: '4px',
            border: '1px solid rgba(185, 131, 46, 0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'help',
          }}
          title={`Original request: ${originalQty || 'Initial quantity'} (Adjusted by Admin). Click View to see breakdown.`}
        >
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--amber)' }}></span>
          Adjusted
        </span>
      )}
    </div>
  );
}

export const OrdersTable = ({
  orders = [],
  onStatusChange,
  onView,
  onEdit,
  onDelete,
}) => {
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
              <th style={{ width: '120px' }}>Order ID</th>
              <th>Distributor</th>
              <th>Qty</th>
              <th style={{ width: '110px' }}>Order Value</th>
              <th style={{ width: '110px' }}>Est. Delivery</th>
              <th style={{ width: '110px' }}>Transport</th>
              <th style={{ width: '115px' }}>Status</th>
              <th style={{ textAlign: 'right', width: '135px' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((o) => (
                <tr key={o.id}>
                  <td
                    className="mono"
                    style={{ cursor: onView ? 'pointer' : 'default', fontWeight: 600 }}
                    onClick={() => onView && onView(o)}
                    title="Click to view full order details"
                  >
                    {o.id}
                  </td>
                  <td
                    style={{ fontWeight: 600, color: 'var(--navy)', cursor: onView ? 'pointer' : 'default' }}
                    onClick={() => onView && onView(o)}
                    title="Click to view full order details"
                  >
                    {o.dist}
                  </td>
                  <td className="zoneword">{renderQtySummary(o)}</td>
                  <td className="mono" style={{ fontWeight: 700, color: 'var(--navy)' }}>
                    {computeOrderValue(o)}
                  </td>
                  <td className="zoneword">{o.eta}</td>
                  <td className="zoneword">{o.transport}</td>
                  <td style={{ width: '115px' }}>
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
                          padding: '3px 20px 3px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          fontFamily: 'inherit',
                          textTransform: 'capitalize',
                          whiteSpace: 'nowrap',
                        }}
                        title="Click to change order status"
                      >
                        {getAllowedStatusOptions(o.status).map((opt) => (
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
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                      {onView && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => onView(o)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            height: '28px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            borderRadius: '6px',
                            color: 'var(--navy)',
                          }}
                          title="View Order Details & Audit Comparison"
                        >
                          <Eye className="w-3.5 h-3.5 text-wheat" />
                          <span>View</span>
                        </button>
                      )}
                      {onEdit && (
                        <button
                          type="button"
                          className="icon-sm"
                          disabled={o.status !== 'pending'}
                          onClick={() => o.status === 'pending' && onEdit(o)}
                          style={{
                            opacity: o.status === 'pending' ? 1 : 0.35,
                            cursor: o.status === 'pending' ? 'pointer' : 'not-allowed',
                          }}
                          title={o.status === 'pending' ? 'Edit Order' : `Cannot edit order once ${o.status}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          className="icon-sm danger"
                          disabled={o.status !== 'pending' && o.status !== 'delivered'}
                          onClick={() => (o.status === 'pending' || o.status === 'delivered') && onDelete(o)}
                          style={{
                            opacity: (o.status === 'pending' || o.status === 'delivered') ? 1 : 0.35,
                            cursor: (o.status === 'pending' || o.status === 'delivered') ? 'pointer' : 'not-allowed',
                          }}
                          title={
                            (o.status === 'pending' || o.status === 'delivered')
                              ? 'Delete Order'
                              : `Cannot delete order while ${o.status} (allowed once delivered)`
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyState message="No orders in this status" colSpan={8} />
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

