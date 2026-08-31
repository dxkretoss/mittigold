import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { distributorService } from '../../services/distributorService';
import { productService } from '../../services/productService';
import { invoiceService } from '../../services/invoiceService';
import { parseAmt, fmtINR } from '../../utils/formatCurrency';
import { todayDisplay } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';

export const CreateInvoiceModal = ({
  isOpen,
  onClose,
  companySettings,
  invoice = null,
  onInvoiceCreated,
  onInvoiceUpdated,
}) => {
  const isEditing = !!invoice?.id;
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [distributors, setDistributors] = useState([]);
  const [products, setProducts] = useState([]);

  const [dist, setDist] = useState('');
  const [gstRate, setGstRate] = useState(companySettings?.defaultGst ?? 5);
  const [lines, setLines] = useState([{ productIndex: 0, qty: 10 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      Promise.all([distributorService.getAll(), productService.getAll()]).then(([dists, prods]) => {
        setDistributors(dists || []);
        setProducts(prods || []);

        if (invoice) {
          setDist(invoice.dist || '');
          setGstRate(invoice.gstRate !== undefined ? invoice.gstRate : 5);
          if (invoice.items && invoice.items.length > 0 && prods && prods.length > 0) {
            const mapped = invoice.items.map((item) => {
              const pIdx = prods.findIndex(
                (p) => p.name.toLowerCase() === (item.name || '').toLowerCase()
              );
              const qtyNum = parseInt(String(item.qty).replace(/[^\d]/g, '')) || 10;
              return {
                productIndex: pIdx >= 0 ? pIdx : 0,
                qty: qtyNum,
              };
            });
            setLines(mapped.length > 0 ? mapped : [{ productIndex: 0, qty: 10 }]);
          } else {
            setLines([{ productIndex: 0, qty: 10 }]);
          }
        } else {
          setDist('');
          setGstRate(companySettings?.defaultGst ?? 5);
          setLines([{ productIndex: 0, qty: 10 }]);
        }
      });
    }
  }, [isOpen, invoice, companySettings]);

  const selectedDistributor = distributors.find((d) => d.name === dist);

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
    if (!dist || !lines.length || !products.length) return;

    setIsSubmitting(true);
    try {
      const items = lines.map((l) => {
        const p = products[l.productIndex] || products[0];
        const qtyNum = parseInt(l.qty) || 0;
        const unitPrice = parseAmt(p.price);
        return {
          name: p.name,
          pack: p.pack,
          qty: `${qtyNum} bags`,
          amount: unitPrice * qtyNum,
        };
      });

      const subtotal = items.reduce((s, it) => s + it.amount, 0);
      const gst = Math.round((subtotal * parseInt(gstRate)) / 100);
      const total = subtotal + gst;

      if (isEditing) {
        const updated = await invoiceService.update(invoice.id, {
          dist,
          amt: fmtINR(total),
          status: invoice.status || 'pending',
          date: invoice.date || todayDisplay(),
          items,
          gstRate: parseInt(gstRate),
        });
        showSuccess('Invoice Updated', `${invoice.id} updated successfully.`);
        if (onInvoiceUpdated) onInvoiceUpdated(updated);
        else if (onInvoiceCreated) onInvoiceCreated(updated);
      } else {
        const newInvoice = await invoiceService.add({
          dist,
          amt: fmtINR(total),
          status: 'pending',
          date: todayDisplay(),
          items,
          gstRate: parseInt(gstRate),
        });
        showSuccess('Invoice Created', `${newInvoice.id} is ready.`);
        if (onInvoiceCreated) onInvoiceCreated(newInvoice);
      }
      onClose();
    } catch (err) {
      showError('Save Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Invoice (${invoice.id})` : 'Create New Invoice'}
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
              const form = document.getElementById('createInvoiceForm');
              if (form) form.requestSubmit();
            }}
          >
            <Check className="w-3.5 h-3.5" /> {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Invoice'}
          </button>
        </>
      }
    >
      <form id="createInvoiceForm" onSubmit={handleSubmit}>
        {/* Bill From Header */}
        <div
          className="f-group"
          style={{
            background: 'var(--slate-bg)',
            borderRadius: '9px',
            padding: '11px 13px',
          }}
        >
          <label style={{ marginBottom: '4px' }}>Bill From</label>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
            {companySettings?.name || 'MittiGold Distribution'}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', marginTop: '2px' }}>
            GSTIN {companySettings?.gstin || '24AAAFF1234A1Z5'} ·{' '}
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/settings');
              }}
              style={{ color: 'var(--blue)', background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Edit in Settings
            </button>
          </div>
        </div>

        {/* Distributor Select */}
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

        {/* Distributor preview */}
        {selectedDistributor && (
          <div
            className="f-group"
            style={{
              background: '#FBFAF7',
              border: '1px dashed var(--line)',
              borderRadius: '9px',
              padding: '10px 13px',
              marginTop: '-6px',
            }}
          >
            <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)' }}>
              Billing:{' '}
              {selectedDistributor.billing ||
                `${selectedDistributor.area}, ${selectedDistributor.city}`}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', marginTop: '2px' }}>
              GSTIN: {selectedDistributor.gstin || '— not on file'}
            </div>
          </div>
        )}

        {/* Invoice Lines */}
        <div className="f-group">
          <label>Invoice Items</label>
          <div id="invoiceLines">
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

        {/* GST Rate */}
        <div className="f-group">
          <label>GST Rate</label>
          <select
            value={gstRate}
            onChange={(e) => setGstRate(parseInt(e.target.value))}
          >
            <option value="0">0% — Exempt</option>
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
          </select>
        </div>

        <p style={{ fontSize: '11.5px', color: 'var(--ink-faint)', margin: '4px 0 0' }}>
          Amount is calculated automatically from product price × quantity, plus the selected GST rate.
        </p>
      </form>
    </Modal>
  );
};
