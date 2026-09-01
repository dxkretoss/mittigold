/**
 * Exact SKU Catalog Price Master for FarmFlow Foods Pvt. Ltd. (MittiGold)
 * 9 SKUs across 5 product lines:
 * - Chakki Fresh Atta: 5kg (₹245), 7kg (₹335), 10kg (₹470), 30kg (₹1,340)
 * - Bhakhri Atta: 5kg (₹260), 30kg (₹1,420)
 * - Maida: 30kg (₹1,100)
 * - Rava: 30kg (₹1,180)
 * - Sooji: 30kg (₹1,150)
 */

export function parseItemPrice(name = '', pack = '') {
  const cleanName = (name || '').toLowerCase().trim();
  const cleanPack = (pack || '').toLowerCase().replace(/\s+/g, '');

  if (cleanName.includes('sooji')) return 1150;
  if (cleanName.includes('rava') && cleanName.includes('sooji')) return 1165;
  if (cleanName.includes('rava')) return 1180;
  if (cleanName.includes('maida')) return 1100;

  if (cleanName.includes('bhakhri')) {
    if (cleanPack.includes('5kg')) return 260;
    return 1420;
  }

  if (cleanName.includes('chakki') || cleanName.includes('atta')) {
    if (cleanPack.includes('5kg')) return 245;
    if (cleanPack.includes('7kg')) return 335;
    if (cleanPack.includes('10kg')) return 470;
    return 1340; // 30kg
  }

  return 1200;
}

export function parseStringItemPrice(itemText = '') {
  const text = itemText.toLowerCase();

  if (text.includes('sooji')) return 1150;
  if (text.includes('rava') && text.includes('sooji')) return 1165;
  if (text.includes('rava')) return 1180;
  if (text.includes('maida')) return 1100;

  if (text.includes('bhakhri')) {
    if (text.includes('5kg') || text.includes('5 kg')) return 260;
    return 1420;
  }

  if (text.includes('chakki') || text.includes('atta')) {
    if (text.includes('5kg') || text.includes('5 kg')) return 245;
    if (text.includes('7kg') || text.includes('7 kg')) return 335;
    if (text.includes('10kg') || text.includes('10 kg')) return 470;
    return 1340;
  }

  return 1200;
}

export function computeOrderValue(order, invoices = []) {
  if (!order) return '—';

  // 1. If explicit amt exists
  if (order.amt) {
    return String(order.amt).startsWith('₹') ? order.amt : `₹${order.amt}`;
  }
  if (order.order_value) {
    return String(order.order_value).startsWith('₹') ? order.order_value : `₹${order.order_value}`;
  }

  // 2. Check matching invoice
  if (Array.isArray(invoices) && invoices.length > 0) {
    const matchingInv = invoices.find(
      (inv) => inv.order_id === order.id || inv.id === order.invoice_id
    );
    if (matchingInv && matchingInv.amt) {
      return String(matchingInv.amt).startsWith('₹') ? matchingInv.amt : `₹${matchingInv.amt}`;
    }
  }

  // 3. Structured items
  if (Array.isArray(order.items) && order.items.length > 0) {
    const total = order.items.reduce((sum, item) => {
      const q = parseInt(String(item.qty).replace(/\D/g, ''), 10) || 1;
      const unitPrice = item.price || parseItemPrice(item.name, item.pack);
      return sum + q * unitPrice;
    }, 0);
    return `₹${total.toLocaleString('en-IN')}`;
  }

  // 4. Qty string with multiple parts (e.g. "28 bags · Sooji (30 kg)" or "15 bags · Chakki Fresh Atta (7 kg)")
  if (typeof order.qty === 'string' && order.qty.trim()) {
    const parts = order.qty.split(',').map((s) => s.trim()).filter(Boolean);
    let orderTotal = 0;

    for (const part of parts) {
      const qtyMatch = part.match(/^(\d+)\s*(?:bags|pcs|pkts|kg)?/i) || part.match(/(\d+)/);
      const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
      const unitPrice = parseStringItemPrice(part);
      orderTotal += qty * unitPrice;
    }

    if (orderTotal > 0) {
      return `₹${orderTotal.toLocaleString('en-IN')}`;
    }
  }

  return '—';
}
