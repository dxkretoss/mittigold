import React, { useState, useRef } from 'react';
import { Download, Loader2, Edit2, Trash2 } from 'lucide-react';
import { Badge } from '../common/Badge';
import { parseAmt, fmtINR } from '../../utils/formatCurrency';
import { useToast } from '../../hooks/useToast';
import html2pdf from 'html2pdf.js';

function extractNameAndPack(rawName = '', rawPack = '') {
  let name = String(rawName || '').trim();
  let pack = String(rawPack || '').trim();

  // If pack is missing or '—', extract from parenthesis e.g. "Sooji (30 kg)" -> name: "Sooji", pack: "30 kg"
  if (!pack || pack === '—') {
    const packMatch = name.match(/\(([^)]+)\)/);
    if (packMatch) {
      pack = packMatch[1].trim();
      name = name.replace(/\([^)]+\)/, '').trim();
    } else {
      const kgMatch = name.match(/(\d+\s*kg)/i);
      if (kgMatch) {
        pack = kgMatch[1].trim();
        name = name.replace(/(\d+\s*kg)/i, '').trim();
      }
    }
  } else if (name.includes('(') && name.includes(')')) {
    name = name.replace(/\([^)]+\)/, '').trim();
  }

  // Clean trailing dashes or dots
  name = name.replace(/[-–·•\s]+$/, '').trim();

  // Default pack fallback based on catalog
  if (!pack || pack === '—') {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('sooji') || lowerName.includes('rava') || lowerName.includes('maida') || lowerName.includes('atta')) {
      pack = '30 kg';
    } else {
      pack = '30 kg';
    }
  }

  return { name: name || 'Commercial Flour Batch', pack };
}

function normalizeInvoiceItems(rawItems, invoiceAmt) {
  if (Array.isArray(rawItems) && rawItems.length > 0) {
    return rawItems.map((it) => {
      const { name, pack } = extractNameAndPack(it.name, it.pack);
      const qty = it.qty ? (String(it.qty).includes('bag') ? String(it.qty) : `${it.qty} bags`) : '1 bag';
      const amount = it.amount !== undefined ? parseAmt(it.amount) : (it.price ? it.price * (parseInt(String(qty).replace(/\D/g, ''), 10) || 1) : (parseAmt(invoiceAmt) / rawItems.length));
      return {
        name,
        pack,
        qty,
        amount,
      };
    });
  }

  if (typeof rawItems === 'string' && rawItems.trim()) {
    try {
      const parsed = JSON.parse(rawItems);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeInvoiceItems(parsed, invoiceAmt);
      }
    } catch (_) {}

    const parts = rawItems.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      return parts.map((part) => {
        const qtyMatch = part.match(/^(\d+)\s*(?:bags|pcs|pkts|kg)?/i) || part.match(/(\d+)/);
        const qty = qtyMatch ? `${qtyMatch[1]} bags` : '1 bag';
        const rawItemText = part.replace(/^\d+\s*(?:bags|pcs|pkts|kg)?\s*[·•-]?\s*/i, '').trim() || part;
        const { name, pack } = extractNameAndPack(rawItemText, '');
        return {
          name,
          pack,
          qty,
          amount: Math.round(parseAmt(invoiceAmt) / parts.length),
        };
      });
    }
  }

  return [
    { name: 'Commercial Flour Batch', pack: '30 kg', qty: '1 Lot', amount: parseAmt(invoiceAmt) || 0 },
  ];
}

export const InvoiceDocument = ({
  invoice,
  companySettings,
  distributors = [],
  onToggleStatus,
  onEdit,
  onDelete,
}) => {
  const { showSuccess, showError } = useToast();
  const [downloading, setDownloading] = useState(false);
  const docRef = useRef(null);

  if (!invoice) {
    return (
      <div className="invoice-doc flex items-center justify-center p-12 text-ink-soft">
        Select an invoice from the list to preview
      </div>
    );
  }

  const items = normalizeInvoiceItems(invoice.items, invoice.amt);
  const subtotal = items.reduce((s, it) => s + parseAmt(it.amount), 0);
  const gstRate =
    typeof invoice.gstRate === 'number'
      ? invoice.gstRate
      : (invoice.gst_rate ?? 5);
  const gst = Math.round((subtotal * gstRate) / 100);
  const total = subtotal + gst;

  const distObj = distributors.find((x) => x.name === invoice.dist);
  const distAddress = distObj
    ? distObj.billing || `${distObj.area || ''}, ${distObj.city || ''}`
    : '';
  const distGstin =
    distObj && distObj.gstin ? distObj.gstin : '— not on file';

  const handleDownloadPdf = async () => {
    if (!docRef.current) return;
    try {
      setDownloading(true);
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${invoice.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(docRef.current).save();
      showSuccess('PDF Downloaded', `${invoice.id}.pdf has been saved to your downloads.`);
    } catch (err) {
      window.print();
      showSuccess('PDF Ready', `Print / Save as PDF opened for ${invoice.id}.`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      {/* Printable Invoice Sheet */}
      <div ref={docRef} className="invoice-doc" style={{ background: '#FFFFFF' }}>
        {/* Header */}
        <div className="idoc-head">
          <div>
            <div className="mark">M</div>
            <h2>{companySettings?.name || 'MittiGold Distribution'}</h2>
            <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '2px' }}>
              {companySettings?.legal || 'FarmFlow Foods Pvt. Ltd.'}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--ink-faint)', marginTop: '1px' }}>
              GSTIN {companySettings?.gstin || '24AAAFF1234A1Z5'}
            </div>
          </div>
          <div className="idoc-meta">
            Invoice No.
            <b>{invoice.id}</b>
            <div style={{ marginTop: '8px' }}>
              Date
              <b style={{ fontFamily: 'Inter', fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)' }}>
                {invoice.date || '03 Aug 2026'}
              </b>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="idoc-parties">
          <div>
            <span>Bill To</span>
            <b>{invoice.dist}</b>
            {distAddress && (
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '3px' }}>
                {distAddress}
              </div>
            )}
            <div style={{ fontSize: '11.5px', color: 'var(--ink-faint)', marginTop: '2px' }}>
              GSTIN {distGstin}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span>Payment</span>
            <div>
              <Badge
                variant={invoice.status}
                className="mt-1"
              >
                {invoice.status === 'paid' ? 'Paid ✓' : 'Pending'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Items Table with Fixed Column Widths */}
        <table className="idoc-table" style={{ width: '100%', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ width: '42%' }}>Item</th>
              <th style={{ width: '20%' }}>Pack</th>
              <th style={{ width: '18%' }}>Qty</th>
              <th style={{ width: '20%', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 500, color: 'var(--navy)' }}>{it.name}</td>
                <td>{it.pack || '—'}</td>
                <td>{it.qty || '—'}</td>
                <td className="amt" style={{ textAlign: 'right' }}>
                  {fmtINR(parseAmt(it.amount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="idoc-totals">
          <div>
            <span>Subtotal</span>
            <span className="amt">{fmtINR(subtotal)}</span>
          </div>
          <div>
            <span>GST ({gstRate}%)</span>
            <span className="amt">{fmtINR(gst)}</span>
          </div>
          <div className="grand">
            <span>Total Due</span>
            <span className="amt">{fmtINR(total)}</span>
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div style={{ marginTop: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn-primary"
          onClick={handleDownloadPdf}
          disabled={downloading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          {downloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          {downloading ? 'Downloading PDF...' : 'Download PDF'}
        </button>

        {onEdit && (
          <button
            type="button"
            className="btn-outline"
            onClick={() => onEdit(invoice)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Invoice
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            className="btn-outline"
            onClick={() => onDelete(invoice)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--red)',
              borderColor: 'rgba(178, 72, 58, 0.3)',
            }}
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Invoice
          </button>
        )}
      </div>
    </div>
  );
};
