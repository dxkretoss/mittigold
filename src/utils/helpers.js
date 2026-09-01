export function initials(str) {
  if (!str) return '';
  return str
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

export function pad4(n) {
  let s = '' + n;
  while (s.length < 4) s = '0' + s;
  return s;
}

export function formatIndianCurrencyWords(val) {
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''));
  if (!num || isNaN(num) || num <= 0) return '';
  if (num >= 10000000) {
    const cr = num / 10000000;
    return `${Number(cr.toFixed(2))} Crore`;
  }
  if (num >= 100000) {
    const lk = num / 100000;
    return `${Number(lk.toFixed(2))} Lakh`;
  }
  if (num >= 1000) {
    const th = num / 1000;
    return `${Number(th.toFixed(2))} Thousand`;
  }
  return String(num);
}

export function formatAchievementPercent(sales, target) {
  const s = typeof sales === 'number' ? sales : parseFloat(String(sales).replace(/[^0-9.]/g, '')) || 0;
  const t = typeof target === 'number' ? target : parseFloat(String(target).replace(/[^0-9.]/g, '')) || 0;
  if (t <= 0 || s <= 0) return '0%';
  const raw = (s / t) * 100;
  if (raw >= 10) return `${Math.round(raw)}%`;
  if (raw >= 1) return `${Number(raw.toFixed(1))}%`;
  if (raw >= 0.01) return `${Number(raw.toFixed(2))}%`;
  return `${raw.toFixed(3)}%`;
}

