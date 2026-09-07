import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { distributorService } from '../../services/distributorService';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { formatDateDisplay } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';
import { parseItemPrice } from '../../utils/orderPriceHelper';

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

function getProductDefaultRate(p) {
  if (!p) return 1200;
  if (p.price) {
    const num = parseFloat(String(p.price).replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num > 0) return num;
  }
  const catRate = parseItemPrice(p.name, p.pack);
  return catRate > 0 ? catRate : 1200;
}

function parseOrderLines(order, products = []) {
  if (!order) {
    const defaultRate = products.length > 0 ? getProductDefaultRate(products[0]) : 1200;
    return [{ productIndex: 0, qty: 10, price: defaultRate > 0 ? defaultRate : 1200 }];
  }

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
      const validPIdx = pIdx >= 0 ? pIdx : 0;
      const qtyNum = parseInt(String(item.qty).replace(/\D/g, ''), 10) || 10;
      const itemPrice = item.price != null && !isNaN(Number(item.price)) && Number(item.price) > 0 
        ? Number(item.price) 
        : getProductDefaultRate(products[validPIdx]);
      return { 
        productIndex: validPIdx, 
        qty: qtyNum > 0 ? qtyNum : 10, 
        price: itemPrice > 0 ? itemPrice : 1200 
      };
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

      const p = products[bestPIdx];
      const defaultPrice = getProductDefaultRate(p);

      return {
        productIndex: bestPIdx,
        qty: qty > 0 ? qty : 10,
        price: defaultPrice > 0 ? defaultPrice : 1200,
      };
    });

    if (parsed.length > 0) {
      return parsed;
    }
  }

  const firstRate = products.length > 0 ? getProductDefaultRate(products[0]) : 1200;
  return [{ productIndex: 0, qty: 10, price: firstRate > 0 ? firstRate : 1200 }];
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
  const [lines, setLines] = useState([{ productIndex: 0, qty: 10, price: 1200 }]);

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
          const defaultPrice = availableProds.length > 0 ? getProductDefaultRate(availableProds[0]) : 1200;
          setLines([{ productIndex: 0, qty: 10, price: defaultPrice }]);
        }
      });
    }
  }, [isOpen, order]);

  const addLine = () => {
    const nextIdx = Math.min(lines.length, Math.max(0, products.length - 1));
    const defaultP = products[nextIdx] || products[0];
    const defaultRate = getProductDefaultRate(defaultP);
    setLines([...lines, { productIndex: nextIdx >= 0 ? nextIdx : 0, qty: 10, price: defaultRate }]);
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

  const handleProductChange = (idx, newProductIdx) => {
    const p = products[newProductIdx];
    const defaultRate = getProductDefaultRate(p);
    const updated = [...lines];
    updated[idx] = {
      ...updated[idx],
      productIndex: newProductIdx,
      price: defaultRate,
    };
    setLines(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dist || !eta || !lines.length || !products.length) return;

    // Strict validation: qty > 0 and price > 0
    const invalidLine = lines.some((l) => {
      const q = parseInt(l.qty, 10);
      const p = parseFloat(l.price);
      return isNaN(q) || q <= 0 || isNaN(p) || p <= 0;
    });

    if (invalidLine) {
      showError('Validation Error', 'Quantity and Price per bag must be greater than 0 for all order items.');
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
        const priceNum = parseFloat(l.price) || 0;
        return {
          productIndex: l.productIndex,
          name: p.name,
          pack: p.pack,
          qty: q,
          price: priceNum,
          amount: q * priceNum,
        };
      });

      const totalValNum = structuredItems.reduce((s, it) => s + (it.amount || 0), 0);

      if (totalValNum <= 0) {
        showError('Validation Error', 'Total order value must be greater than ₹0.');
        return;
      }

      const selectedDistObj = distributors.find((d) => d.name === dist || d.id === dist);
      const targetZone = selectedDistObj?.zone || order?.zone || 'South Gujarat';
      const orderDate = order?.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const orderTotal = `₹${totalValNum.toLocaleString('en-IN')}`;

      const orderPayload = {
        dist: selectedDistObj?.name || dist,
        dist_id: selectedDistObj?.id || null,
        zone: targetZone,
        date: orderDate,
        total: orderTotal,
        qty: lineDescriptions.join(', '),
        original_qty: order?.original_qty || (isEditing ? (order?.qty || lineDescriptions.join(', ')) : lineDescriptions.join(', ')),
        eta: formatDateDisplay(eta),
        transport: transport.trim() || '—',
        status: status || 'pending',
        items: structuredItems,
        original_items: order?.original_items || (isEditing ? (order?.items || structuredItems) : structuredItems),
        amt: totalValNum,
        order_value: orderTotal,
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

  const liveOrderTotal = lines.reduce((sum, line) => {
    const q = parseFloat(line.qty) || 0;
    const rate = parseFloat(line.price) || 0;
    return sum + q * rate;
  }, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Order (${order?.id})` : 'New Order'}
      maxWidth="580px"
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
        {isEditing && (
          <div style={{ background: '#FAF9F6', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--navy)' }}>
              Order Review & Stock Allocation
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', marginTop: '2px' }}>
              Adjust fulfilled quantities based on available plant stock before dispatching.
            </div>
            {order?.original_qty && order?.original_qty !== order?.qty && (
              <div style={{ fontSize: '11.5px', color: 'var(--amber)', marginTop: '4px', fontWeight: 600 }}>
                • Originally Requested: {order.original_qty}
              </div>
            )}
          </div>
        )}

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ margin: 0 }}>Order Items *</label>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                fontSize: '11px',
                color: 'var(--ink-soft)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                paddingRight: lines.length > 1 ? '40px' : '0px',
              }}
            >
              <span style={{ width: '85px', textAlign: 'center' }}>Qty (Bag)</span>
              <span style={{ width: '115px', textAlign: 'center' }}>Price / Bag (₹)</span>
            </div>
          </div>

          <div id="orderLines">
            {lines.map((line, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: lines.length > 1 ? '1fr 85px 115px 30px' : '1fr 85px 115px',
                  gap: '10px',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <select
                  value={line.productIndex}
                  onChange={(e) =>
                    handleProductChange(idx, parseInt(e.target.value, 10))
                  }
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: '#FBFAF7',
                    color: 'var(--ink)',
                    width: '100%',
                  }}
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
                  style={{
                    padding: '8px 10px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: '#FBFAF7',
                    width: '100%',
                    textAlign: 'center',
                    fontWeight: 600,
                  }}
                  disabled={isSubmitting}
                  required
                />

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--ink-soft)',
                      pointerEvents: 'none',
                    }}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="Price"
                    value={line.price ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateLine(idx, 'price', val);
                    }}
                    style={{
                      padding: '8px 8px 8px 20px',
                      fontSize: '13px',
                      fontFamily: 'IBM Plex Mono, monospace',
                      fontWeight: 600,
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: '#FBFAF7',
                      width: '100%',
                      textAlign: 'right',
                    }}
                    disabled={isSubmitting}
                    required
                    title="Enter price per bag"
                  />
                </div>

                {lines.length > 1 && (
                  <button
                    type="button"
                    className="line-remove"
                    onClick={() => removeLine(idx)}
                    aria-label="Remove item"
                    disabled={isSubmitting}
                    title="Remove item"
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '7px',
                      border: 'none',
                      background: 'var(--red-bg)',
                      color: 'var(--red)',
                      fontSize: '16px',
                      cursor: 'pointer',
                    }}
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

        {/* Live Order Value Calculation Box */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAF9F6', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 14px', margin: '10px 0 14px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--navy)' }}>Calculated Total Value:</span>
          <span className="mono" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--green)' }}>
            ₹{liveOrderTotal.toLocaleString('en-IN')}
          </span>
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
            <label>Transport / Vehicle (optional)</label>
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
