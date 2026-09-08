import React from 'react';
import { Package, Truck, Calendar, User, Edit2, Send, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { computeOrderValue, parseItemPrice } from '../../utils/orderPriceHelper';
import { ORDER_STATUS_LABELS } from '../../utils/constants';

function parseDetailedItems(order) {
  if (!order) return [];

  // Parse original quantities
  let originalMap = [];
  if (Array.isArray(order.original_items) && order.original_items.length > 0) {
    originalMap = order.original_items.map((it) => ({
      name: it.name || '',
      pack: it.pack || '',
      qty: parseInt(String(it.qty).replace(/\D/g, ''), 10) || null,
    }));
  } else if (typeof order.original_qty === 'string') {
    const origParts = order.original_qty.split(',').map((s) => s.trim()).filter(Boolean);
    originalMap = origParts.map((part) => {
      const qm = part.match(/^(\d+)\s*(?:bags|pcs|pkts|kg)?/i) || part.match(/(\d+)/);
      const q = qm ? parseInt(qm[1], 10) : null;
      const cleanName = part.replace(/^\d+\s*(?:bags|pcs|pkts|kg)?\s*[·•-]?\s*/i, '').trim().toLowerCase();
      return { raw: cleanName, qty: q };
    });
  }

  // 1. Structured items
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.map((it, idx) => {
      const name = it.name || 'Commercial Flour';
      const pack = it.pack || '30 kg';
      const fulfilledQty = parseInt(String(it.qty).replace(/\D/g, ''), 10) || 1;
      const rate = it.price != null && !isNaN(Number(it.price)) ? Number(it.price) : parseItemPrice(name, pack);

      let origQty = null;
      if (originalMap[idx] && originalMap[idx].qty !== null) {
        origQty = originalMap[idx].qty;
      } else {
        const found = originalMap.find((o) =>
          (o.name && o.name.toLowerCase().includes(name.toLowerCase())) ||
          (o.raw && o.raw.includes(name.toLowerCase()))
        );
        if (found) origQty = found.qty;
      }

      return {
        name: `${name} (${pack})`,
        pack,
        fulfilledQty,
        originalQty: origQty,
        rate,
        total: rate * fulfilledQty,
      };
    });
  }

  // 2. Comma-separated string
  if (typeof order.qty === 'string') {
    const parts = order.qty.split(',').map((s) => s.trim()).filter(Boolean);
    return parts.map((part, idx) => {
      const qtyMatch = part.match(/^(\d+)\s*(?:bags|pcs|pkts|kg)?/i) || part.match(/(\d+)/);
      const fulfilledQty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
      const cleanName = part.replace(/^\d+\s*(?:bags|pcs|pkts|kg)?\s*[·•-]?\s*/i, '').trim() || part;
      const rate = parseItemPrice(cleanName);

      let origQty = null;
      if (originalMap[idx] && originalMap[idx].qty !== null) {
        origQty = originalMap[idx].qty;
      } else {
        const found = originalMap.find((o) => o.raw && o.raw.includes(cleanName.toLowerCase()));
        if (found) origQty = found.qty;
      }

      return {
        name: cleanName,
        pack: '30 kg',
        fulfilledQty,
        originalQty: origQty,
        rate,
        total: rate * fulfilledQty,
      };
    });
  }

  return [];
}

export const OrderDetailsModal = ({
  isOpen,
  onClose,
  order,
  onEdit,
  onDispatch,
}) => {
  if (!isOpen || !order) return null;

  const items = parseDetailedItems(order);
  const isAdjusted = Boolean(
    order.is_adjusted ||
    (order.original_qty &&
      String(order.original_qty).trim() &&
      String(order.original_qty).trim().toLowerCase() !== String(order.qty).trim().toLowerCase())
  );

  const totalOrderValue = computeOrderValue(order);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order Details — ${order.id}`}
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Top Info Banner */}
        <div
          style={{
            background: '#FAF9F5',
            border: '1px solid var(--line)',
            borderRadius: '10px',
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              Distributor
            </span>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy)', marginTop: '2px' }}>
              {order.dist}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              Order Status
            </span>
            <div style={{ marginTop: '3px' }}>
              <span className={`chip ${order.status || 'pending'}`} style={{ textTransform: 'capitalize' }}>
                {ORDER_STATUS_LABELS[order.status] || order.status || 'Pending'}
              </span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              Est. Delivery
            </span>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
              {order.eta || '—'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              Transport
            </span>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
              {order.transport || '—'}
            </div>
          </div>
        </div>

        {/* Quantity Adjustment Audit Banner */}
        {isAdjusted && (
          <div
            style={{
              background: '#FFF9ED',
              border: '1px solid #EAC878',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <AlertTriangle className="w-5 h-5 text-amber flex-shrink-0" style={{ marginTop: '1px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Order Quantity Adjusted by Admin</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: 'var(--amber-bg)',
                    color: 'var(--amber)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(185, 131, 46, 0.35)',
                  }}
                >
                  Adjusted Record
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink)', marginTop: '4px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>Distributor Placed:</span>{' '}
                  <strong style={{ color: 'var(--red)', fontWeight: 700 }}>{order.original_qty || 'Initial request'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>Admin Fulfilled:</span>{' '}
                  <strong style={{ color: 'var(--green)', fontWeight: 700 }}>{order.qty}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Items Table */}
        <div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
            Fulfilled Line Items
          </div>
          <div className="overflow-x-auto" style={{ border: '1px solid var(--line)', borderRadius: '8px' }}>
            <table>
              <thead>
                <tr style={{ background: '#FAFAF8' }}>
                  <th>Item / Product</th>
                  <th>Quantity</th>
                  <th>Unit Rate</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? (
                  items.map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{it.name}</td>
                      <td>
                        {it.originalQty && it.originalQty !== it.fulfilledQty ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <del style={{ color: 'var(--red)', fontWeight: 600, fontSize: '12px' }}>
                              {it.originalQty} bags
                            </del>
                            <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: '13px' }}>
                              → {it.fulfilledQty} bags
                            </span>
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                background: 'var(--amber-bg)',
                                color: 'var(--amber)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                border: '1px solid rgba(185, 131, 46, 0.35)',
                              }}
                            >
                              {it.fulfilledQty - it.originalQty > 0
                                ? `+${it.fulfilledQty - it.originalQty}`
                                : `${it.fulfilledQty - it.originalQty}`}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontWeight: 600, color: 'var(--navy)' }}>
                            {it.fulfilledQty} bags
                          </span>
                        )}
                      </td>
                      <td className="mono">₹{it.rate?.toLocaleString('en-IN') || '—'}</td>
                      <td className="mono" style={{ textAlign: 'right', fontWeight: 700 }}>
                        ₹{it.total?.toLocaleString('en-IN') || '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '16px', color: 'var(--ink-soft)' }}>
                      {order.qty}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Box */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#FAF9F5',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            padding: '12px 16px',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>
            Calculated Order Value:
          </span>
          <span className="mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--green)' }}>
            {totalOrderValue}
          </span>
        </div>

        {/* Modal Actions Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          {onEdit && order.status === 'pending' && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                onClose();
                onEdit(order);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Order</span>
            </button>
          )}
          {order.status !== 'dispatched' && order.status !== 'delivered' && onDispatch && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onClose();
                onDispatch(order);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Order</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
