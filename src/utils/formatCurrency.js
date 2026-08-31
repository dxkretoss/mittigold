export function parseAmt(v) {
  if (typeof v === 'number') return v;
  return parseInt(String(v).replace(/[^\d]/g, '')) || 0;
}

export function fmtINR(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}
