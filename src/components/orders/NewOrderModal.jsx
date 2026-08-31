import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { distributorService } from '../../services/distributorService';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { formatDateDisplay } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';

function convertDateToInput(dateStr) {
  if (!dateStr || dateStr === '—') return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return '';
}

function parseOrderLines(order, products = []) {
  if (!order) return [{ productIndex: 0, qty: 10 }];

  // 1. If order already has structured items array
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.map((item) => {
      let pIdx = typeof item.productIndex === 'number' ? item.productIndex : -1;
      if (pIdx < 0 || pIdx >= products.length) {
        pIdx = products.findIndex((p) => {
          const nameMatch = item.name && p.name.toLowerCase().includes(item.name.toLowerCase());
          const packMatch = item.pack && (p.pack.toLowerCase().replace(/\s+/g, '') === item.pack.toLowerCase().replace(/\s+/g, ''));
          return nameMatch && packMatch;
        });
        if (pIdx < 0) {
          pIdx = products.findIndex((p) => item.name && p.name.toLowerCase().includes(item.name.toLowerCase()));
        }
      }
      const qtyNum = parseInt(String(item.qty).replace(/\D/g, ''), 10) || 10;
      return { productIndex: pIdx >= 0 ? pIdx : 0, qty: qtyNum };
    });
  }

  // 2. If order.qty is a string with comma-separated items
  if (typeof order.qty === 'string' && order.qty.trim()) {
    const parts = order.qty.split(',').map((s) => s.trim()).filter(Boolean);
    const parsed = parts.map((part) => {
      const qtyMatch = part.match(/^(\d+)\s*(?:bags|pcs|pkts|kg)?/i) || part.match(/(\d+)/);
      const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 10;

      let bestPIdx = 0;
      const lowerPart = part.toLowerCase();

      for (let i = 0; i < products.length; i++) {
        const pName = products[i].name.toLowerCase();
        const pPack = products[i].pack.toLowerCase().replace(/\s+/g, '');
        const cleanPart = lowerPart.replace(/\s+/g, '');

        if (cleanPart.includes(pName.replace(/\s+/g, '')) && cleanPart.includes(pPack)) {
          bestPIdx = i;
          break;
        } else if (lowerPart.includes(pName)) {
          bestPIdx = i;
        }
      }

      return {
        productIndex: bestPIdx,
        qty: qty || 10,
      };
    });

    if (parsed.length > 0) {
      return parsed;
    }
  }

  return [{ productIndex: 0, qty: 10 }];
}

export const NewOrderModal = ({
  isOpen,
  onClose,
  order = null,
  onOrderCreated,
  onOrderUpdated,
}) => {
  const isEditing = !!order?.id;
  const { showSuccess, showError } = useToast();
  const [distributors, setDistributors] = useState([]);
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dist, setDist] = useState('');
  const [eta, setEta] = useState('');
  const [transport, setTransport] = useState('');
  const [status, setStatus] = useState('pending');
  const [lines, setLines] = useState([{ productIndex: 0, qty: 10 }]);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (isOpen) {
      distributorService.getAll().then(setDistributors);
      productService.getAll().then((prods) => {
        const availableProds = prods || [];
        setProducts(availableProds);

        if (order) {
          setDist(order.dist || '');
          setEta(convertDateToInput(order.eta) || todayStr);
          setTransport(order.transport === '—' ? '' : order.transport || '');
          setStatus(order.status || 'pending');
          setLines(parseOrderLines(order, availableProds));
        } else {
          setDist('');
          setEta(todayStr);
          setTransport('');
          setStatus('pending');
          setLines([{ productIndex: 0, qty: 10 }]);
        }
      });
    }
  }, [isOpen, order]);

  const addLine = () => {
    setLines([...lines, { productIndex: 0, qty: 10 }]);
  };

  const removeLine = (index) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;
    setLines(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dist || !eta || !lines.length || !products.length) return;

    // Validate that all lines have non-empty, positive quantities
    const invalidLine = lines.some((l) => {
      const q = parseInt(l.qty, 10);
      return isNaN(q) || q <= 0;
    });

    if (invalidLine) {
      showError('Validation Error', 'Please enter a valid quantity (greater than 0) for all order items.');
      return;
    }

    setIsSubmitting(true);

    try {
      const lineDescriptions = lines.map((l) => {
        const p = products[l.productIndex] || products[0];
        const q = parseInt(l.qty, 10) || 1;
        return `${q} bags · ${p.name} (${p.pack})`;
      });

      const structuredItems = lines.map((l) => {
        const p = products[l.productIndex] || products[0];
        const q = parseInt(l.qty, 10) || 1;
        return {
          productIndex: l.productIndex,
          name: p.name,
          pack: p.pack,
          qty: q,
        };
      });

      const orderPayload = {
        dist,
        qty: lineDescriptions.join(', '),
        eta: formatDateDisplay(eta),
        transport: transport.trim() || '—',
        status: status || 'pending',
        items: structuredItems,
      };

      if (isEditing) {
        const updated = await orderService.update(order.id, orderPayload);
        showSuccess('Order Updated', `${order.id} has been updated.`);
        if (onOrderUpdated) onOrderUpdated(updated);
      } else {
        const newOrder = await orderService.add(orderPayload);
        showSuccess('Order Created', `${newOrder.id} added to the Pending queue.`);
        if (onOrderCreated) onOrderCreated(newOrder);
      }

      onClose();
    } catch (err) {
      showError(isEditing ? 'Update Failed' : 'Order Creation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Order (${order?.id})` : 'New Order'}
      footer={
        <>
          <button className="btn-outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            className="btn-primary"
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              const form = document.getElementById('newOrderForm');
              if (form) form.requestSubmit();
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {isEditing ? 'Saving...' : 'Creating...'}
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" /> {isEditing ? 'Save Changes' : 'Create Order'}
              </>
            )}
          </button>
        </>
      }
    >
      <form id="newOrderForm" onSubmit={handleSubmit}>
        <div className="f-group">
          <label>Distributor *</label>
          <select
            required
            value={dist}
            onChange={(e) => setDist(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">Select distributor</option>
            {distributors.map((d) => (
              <option key={d.id || d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="f-group">
          <label>Order Items</label>
          <div id="orderLines">
            {lines.map((line, idx) => (
              <div key={idx} className="lineitem">
                <select
                  value={line.productIndex}
                  onChange={(e) =>
                    updateLine(idx, 'productIndex', parseInt(e.target.value))
                  }
                  className="li-prod"
                  disabled={isSubmitting}
                >
                  {products.map((p, pIdx) => (
                    <option key={p.id || pIdx} value={pIdx}>
                      {p.name} — {p.pack}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={line.qty ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateLine(idx, 'qty', val === '' ? '' : (parseInt(val, 10) || ''));
                  }}
                  className="li-qty"
                  disabled={isSubmitting}
                  required
                />

                <span className="zoneword">bags</span>

                {lines.length > 1 && (
                  <button
                    type="button"
                    className="line-remove"
                    onClick={() => removeLine(idx)}
                    aria-label="Remove item"
                    disabled={isSubmitting}
                    title="Remove item"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="add-line-btn"
            onClick={addLine}
            disabled={isSubmitting}
          >
            + Add another item
          </button>
        </div>

        <div className="f-row">
          <div className="f-group">
            <label>Estimated Delivery *</label>
            <input
              type="date"
              required
              min={todayStr}
              value={eta}
              onChange={(e) => setEta(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="f-group">
            <label>Transport (optional)</label>
            <input
              type="text"
              placeholder="e.g. Tata Ace · GJ-05-AB-1123"
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {isEditing && (
          <div className="f-group" style={{ marginTop: '6px' }}>
            <label>Order Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        )}
      </form>
    </Modal>
  );
};
