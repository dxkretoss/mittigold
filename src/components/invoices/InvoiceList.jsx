import React from 'react';
import { Badge } from '../common/Badge';

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
                {inv.amt}
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
