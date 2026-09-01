import { supabase } from '../lib/supabase';
import { pad4 } from '../utils/helpers';
import { notificationService } from './notificationService';

const ORDERS_STORAGE_KEY = 'mittigold_orders_data';

function getLocalOrders() {
  try {
    const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return [];
}

function saveLocalOrders(orders) {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (_) {}
}

/**
 * Custom Service Functions for Orders
 * 100% Dynamic Supabase queries with robust local synchronization
 */
export const orderService = {
  /**
   * Fetch all orders with optional status filter from Supabase (with local fallback and merge)
   */
  async getAll(filter = 'all') {
    const local = getLocalOrders();
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter && filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (!error && data) {
        const remoteIds = new Set(data.map((r) => r.id));
        const localOnly = local.filter((l) => l.id && !remoteIds.has(l.id));
        const merged = [
          ...data.map((remote) => {
            const matched = local.find((l) => l.id === remote.id);
            return {
              ...remote,
              items: remote.items || matched?.items || null,
              original_qty: remote.original_qty || matched?.original_qty || null,
              original_items: remote.original_items || matched?.original_items || null,
            };
          }),
          ...localOnly
        ].sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0) || String(b.id).localeCompare(String(a.id))
        );
        if (filter === 'all') {
          saveLocalOrders(merged);
        }
        return filter && filter !== 'all' ? merged.filter((o) => o.status === filter) : merged;
      }
    } catch (err) {
      console.warn('Supabase orders query error, falling back to local:', err);
    }

    const sortedLocal = [...local].sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0) || String(b.id).localeCompare(String(a.id))
    );
    if (filter && filter !== 'all') {
      return sortedLocal.filter((o) => o.status === filter);
    }
    return sortedLocal;
  },

  /**
   * Fetch orders awaiting dispatch (status !== 'delivered')
   */
  async getAwaitingDispatch(limit = 4) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .neq('status', 'delivered')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('Failed to load awaiting orders:', err);
    }

    const local = getLocalOrders();
    return local.filter((o) => o.status !== 'delivered').slice(0, limit);
  },

  /**
   * Get total count of pending / active orders
   */
  async getPendingCount() {
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'delivered');

      if (!error && typeof count === 'number') {
        return count;
      }
    } catch (_) {}

    const local = getLocalOrders();
    return local.filter((o) => o.status !== 'delivered').length;
  },

  /**
   * Get total count of all orders in database
   */
  async getTotalCount() {
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      if (!error && typeof count === 'number') {
        return count;
      }
    } catch (_) {}

    const local = getLocalOrders();
    return local.length;
  },

  /**
   * Calculate next sequential order ID (e.g. MG-2026-0234)
   */
  async getNextId() {
    const all = await this.getAll('all');
    if (all && all.length > 0) {
      const nums = all.map((o) => {
        const parts = String(o.id || '').split('-');
        const n = parseInt(parts[parts.length - 1], 10);
        return isNaN(n) ? 0 : n;
      });
      const maxNum = nums.reduce((m, n) => Math.max(m, n), 0);
      return 'MG-2026-' + pad4(maxNum + 1);
    }
    return 'MG-2026-0001';
  },

  /**
   * Add a new order directly to Supabase & local cache
   */
  async add(orderData) {
    const nextId = orderData.id || await this.getNextId();
    
    // Exact columns present in Supabase orders table schema
    const dbPayload = {
      id: nextId,
      dist: orderData.dist,
      qty: orderData.qty,
      eta: orderData.eta,
      transport: orderData.transport || '—',
      status: orderData.status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const fullOrder = {
      ...dbPayload,
      items: orderData.items || null,
      original_qty: orderData.original_qty || orderData.qty,
      original_items: orderData.original_items || orderData.items || null,
    };

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([dbPayload])
        .select();

      if (!error && data?.[0]) {
        const local = getLocalOrders();
        const savedItem = {
          ...data[0],
          items: orderData.items || null,
          original_qty: orderData.original_qty || orderData.qty,
          original_items: orderData.original_items || orderData.items || null,
        };
        saveLocalOrders([savedItem, ...local.filter(o => o.id !== data[0].id)]);
        this.notify();
        return savedItem;
      }
      if (error) {
        console.warn('Supabase insert order error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase insert order fallback to local:', err);
    }

    const local = getLocalOrders();
    const updated = [fullOrder, ...local.filter(o => o.id !== nextId)];
    saveLocalOrders(updated);
    this.notify();

    try {
      notificationService.add({
        type: 'order',
        title: 'New Order Placed',
        message: `${orderData.dist} placed order ${nextId} (${orderData.qty}).`,
        link: '/orders',
      }).catch(() => {});
    } catch (_) {}

    return fullOrder;
  },

  /**
   * Update order status directly in Supabase & local cache
   */
  async updateStatus(orderId, newStatus) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select();

      if (!error && data?.[0]) {
        const local = getLocalOrders();
        const existing = local.find((o) => o.id === orderId);
        const updated = local.map((o) => (o.id === orderId ? { ...existing, ...data[0] } : o));
        saveLocalOrders(updated);
        this.notify();
        return { ...existing, ...data[0] };
      }
    } catch (err) {
      console.warn('Supabase update order status fallback to local:', err);
    }

    const local = getLocalOrders();
    const existing = local.find((o) => o.id === orderId);
    const updated = local.map((o) => (o.id === orderId ? { ...existing, ...o, status: newStatus, updated_at: new Date().toISOString() } : o));
    saveLocalOrders(updated);
    this.notify();
    return { ...existing, id: orderId, status: newStatus };
  },

  /**
   * Update full order details directly in Supabase & local cache
   */
  async update(orderId, orderData) {
    const local = getLocalOrders();
    const existing = local.find((o) => o.id === orderId);

    const original_qty = orderData.original_qty || existing?.original_qty || (existing?.qty && orderData.qty !== existing.qty ? existing.qty : null);
    const original_items = orderData.original_items || existing?.original_items || (existing?.items && orderData.items !== existing.items ? existing.items : null);

    // Only send valid columns in Supabase orders table
    const dbPayload = {
      dist: orderData.dist,
      qty: orderData.qty,
      eta: orderData.eta,
      transport: orderData.transport || '—',
      status: orderData.status || 'pending',
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('orders')
        .update(dbPayload)
        .eq('id', orderId)
        .select();

      if (!error && data?.[0]) {
        const savedItem = {
          ...existing,
          ...data[0],
          items: orderData.items !== undefined ? orderData.items : existing?.items,
          original_qty,
          original_items,
        };
        saveLocalOrders([savedItem, ...local.filter(o => o.id !== data[0].id)]);
        this.notify();
        return savedItem;
      }
    } catch (err) {
      console.warn('Supabase update order fallback to local:', err);
    }

    const savedFallback = {
      ...existing,
      ...dbPayload,
      items: orderData.items !== undefined ? orderData.items : existing?.items,
      original_qty,
      original_items,
    };
    saveLocalOrders([savedFallback, ...local.filter(o => o.id !== orderId)]);
    this.notify();
    return savedFallback;
  },

  /**
   * Delete an order directly from Supabase & local cache
   */
  async delete(orderId) {
    try {
      await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
    } catch (err) {
      console.warn('Supabase delete order fallback to local:', err);
    }

    const local = getLocalOrders();
    const filtered = local.filter((o) => o.id !== orderId);
    saveLocalOrders(filtered);
    this.notify();
    return true;
  },

  notify() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mittigold-order-created'));
      window.dispatchEvent(new CustomEvent('mittigold-order-updated'));
    }
  }
};
