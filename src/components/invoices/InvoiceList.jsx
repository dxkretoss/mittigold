import React from 'react';
import { Badge } from '../common/Badge';
import { parseAmt, fmtINR } from '../../utils/formatCurrency';
import { parseItemPrice } from '../../utils/orderPriceHelper';

function getDisplayAmount(inv) {
  if (!inv) return '₹0';

  let itemsArr = [];
  if (Array.isArray(inv.items) && inv.items.length > 0) {
    itemsArr = inv.items;
  } else if (typeof inv.items === 'string' && inv.items.trim()) {
    try {
      const parsed = JSON.parse(inv.items);
      if (Array.isArray(parsed) && parsed.length > 0) itemsArr = parsed;
    } catch (_) {}
  }

  if (itemsArr.length > 0) {
    const subtotal = itemsArr.reduce((s, it) => {
      if (it.amount !== undefined && it.amount !== null && it.amount !== 0) {
        return s + parseAmt(it.amount);
      }
      const q = parseInt(String(it.qty).replace(/\D/g, ''), 10) || 1;
      const rate = it.price ? parseAmt(it.price) : parseItemPrice(it.name, it.pack);
      return s + (rate * q);
    }, 0);

    if (subtotal > 0) {
      const gstRate = typeof inv.gstRate === 'number' ? inv.gstRate : (inv.gst_rate ?? 5);
      const gst = Math.round((subtotal * gstRate) / 100);
      const total = subtotal + gst;
      return fmtINR(total);
    }
  }

  if (inv.amt && inv.amt !== '₹0') {
    const rawAmt = parseAmt(inv.amt);
    if (rawAmt > 0) {
      const gstRate = typeof inv.gstRate === 'number' ? inv.gstRate : (inv.gst_rate ?? 5);
      const gst = Math.round((rawAmt * gstRate) / 100);
      const total = rawAmt + gst;
      return fmtINR(total);
    }
  }

  return '₹0';
}

export const InvoiceList = ({ invoices = [], selectedId, onSelect }) => {
  if (invoices.length === 0) {
    return (
      <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--ink-soft)', fontSize: '12.5px' }}>
        No invoices found
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {invoices.map((inv) => {
        const isSelected = selectedId === inv.id;
        const displayAmount = getDisplayAmount(inv);

        return (
          <div
            key={inv.id}
            onClick={() => onSelect(inv.id)}
            className={`flex justify-between items-center p-3 rounded-lg border transition-all cursor-pointer ${
              isSelected
                ? 'bg-wheat-light/15 border-wheat/40 shadow-sm'
                : 'hover:bg-slateBg/60 border-dashed border-line'
            }`}
          >
            <div>
              <div className="nm mono text-[12.5px] font-semibold text-navy">
                {inv.id}
              </div>
              <div className="sub text-[11.5px] text-ink-soft">
                {inv.dist}
              </div>
            </div>
            <div className="text-right">
              <div className="amt font-semibold text-ink">
                {displayAmount}
              </div>
              <Badge
                variant={inv.status}
                className="mt-1 text-[10px] py-0.5 px-2"
              >
                {inv.status === 'paid' ? 'Paid' : 'Pending'}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
};
