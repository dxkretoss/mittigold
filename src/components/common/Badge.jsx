import React from 'react';
import { STAGE_LABELS, ORDER_STATUS_LABELS, INVOICE_STATUS_LABELS } from '../../utils/constants';

export const Badge = ({ type, variant, children, className = '' }) => {
  // Determine display label if not explicitly provided
  let label = children;
  if (!label) {
    if (type === 'stage' && STAGE_LABELS[variant]) {
      label = STAGE_LABELS[variant];
    } else if (type === 'order' && ORDER_STATUS_LABELS[variant]) {
      label = ORDER_STATUS_LABELS[variant];
    } else if (type === 'invoice' && INVOICE_STATUS_LABELS[variant]) {
      label = INVOICE_STATUS_LABELS[variant];
    } else if (variant === 'paid') {
      label = 'Paid';
    } else if (variant === 'unpaid') {
      label = 'Unpaid';
    } else {
      label = variant;
    }
  }

  return (
    <span className={`chip ${variant} ${className}`}>
      {label}
    </span>
  );
};
