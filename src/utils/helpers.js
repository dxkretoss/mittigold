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
