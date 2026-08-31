import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { distributorService } from '../../services/distributorService';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { formatDateDisplay } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';

export const NewOrderModal = ({ isOpen, onClose, onOrderCreated }) => {
  const { showSuccess } = useToast();
  const [distributors, setDistributors] = useState([]);
  const [products, setProducts] = useState([]);

  const [dist, setDist] = useState('');
  const [eta, setEta] = useState('');
  const [transport, setTransport] = useState('');
  const [lines, setLines] = useState([{ productIndex: 0, qty: 10 }]);

  useEffect(() => {
    if (isOpen) {
      distributorService.getAll().then(setDistributors);
      productService.getAll().then(setProducts);
    }
  }, [isOpen]);

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

    const lineDescriptions = lines.map((l) => {
      const p = products[l.productIndex] || products[0];
      return `${l.qty} bags · ${p.name} (${p.pack})`;
    });

    const newOrder = await orderService.add({
      dist,
      qty: lineDescriptions.join(', '),
      eta: formatDateDisplay(eta),
      transport: transport.trim() || '—',
      status: 'pending',
    });

    showSuccess('Order Created', `${newOrder.id} added to the Pending queue.`);
    if (onOrderCreated) onOrderCreated(newOrder);
    onClose();

    // Reset
    setDist('');
    setEta('');
    setTransport('');
    setLines([{ productIndex: 0, qty: 10 }]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Order"
      footer={
        <>
          <button className="btn-outline" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            type="button"
            onClick={() => {
              const form = document.getElementById('newOrderForm');
              if (form) form.requestSubmit();
            }}
          >
            <Check className="w-3.5 h-3.5" /> Create Order
          </button>
        </>
      }
    >
      <form id="newOrderForm" onSubmit={handleSubmit}>
        <div className="f-group">
          <label>Distributor</label>
          <select
            required
            value={dist}
            onChange={(e) => setDist(e.target.value)}
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
                  value={line.qty}
                  onChange={(e) =>
                    updateLine(idx, 'qty', parseInt(e.target.value) || 1)
                  }
                  className="li-qty"
                />

                <span className="zoneword">bags</span>

                <button
                  type="button"
                  className="line-remove"
                  onClick={() => removeLine(idx)}
                  aria-label="Remove item"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="add-line-btn"
            onClick={addLine}
          >
            + Add another item
          </button>
        </div>

        <div className="f-row">
          <div className="f-group">
            <label>Estimated Delivery</label>
            <input
              type="date"
              required
              value={eta}
              onChange={(e) => setEta(e.target.value)}
            />
          </div>
          <div className="f-group">
            <label>Transport (optional)</label>
            <input
              type="text"
              placeholder="e.g. Tata Ace · GJ-05-AB-1123"
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
