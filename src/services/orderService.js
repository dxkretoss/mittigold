import { supabase } from '../lib/supabase';
import { pad4 } from '../utils/helpers';

/**
 * Custom Service Functions for Orders
 * 100% Dynamic Supabase queries (No static data)
 */
export const orderService = {
  /**
   * Fetch all orders with optional status filter from Supabase
   */
  async getAll(filter = 'all') {
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter && filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Failed to load orders from Supabase:', error.message);
      return [];
    }
    return data || [];
  },

  /**
   * Fetch orders awaiting dispatch (status !== 'delivered')
   */
  async getAwaitingDispatch(limit = 4) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'delivered')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Failed to load awaiting orders:', error.message);
      return [];
    }
    return data || [];
  },

  /**
   * Get total count of pending / active orders
   */
  async getPendingCount() {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'delivered');

    if (error) {
      console.warn('Failed to get pending orders count:', error.message);
      return 0;
    }
    return count ?? 0;
  },

  /**
   * Get total count of all orders in database
   */
  async getTotalCount() {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.warn('Failed to get total orders count:', error.message);
      return 0;
    }
    return count ?? 0;
  },

  /**
   * Generate next sequential Order ID (e.g. MG-2026-0232)
   */
  async getNextId() {
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .order('id', { ascending: false })
      .limit(10);

    if (!error && data && data.length > 0) {
      const nums = data.map(o => parseInt(o.id.split('-').pop(), 10) || 0);
      const maxNum = nums.reduce((m, n) => Math.max(m, n), 0);
      return 'MG-2026-' + pad4(maxNum + 1);
    }
    return 'MG-2026-0001';
  },

  /**
   * Add a new order directly to Supabase
   */
  async add(orderData) {
    const nextId = orderData.id || await this.getNextId();
    const payload = {
      id: nextId,
      dist: orderData.dist,
      qty: orderData.qty,
      eta: orderData.eta,
      transport: orderData.transport || '—',
      status: orderData.status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([payload])
      .select();

    if (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }

    return data?.[0] || payload;
  },

  /**
   * Update order status directly in Supabase
   */
  async updateStatus(orderId, newStatus) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select();

    if (error) {
      throw new Error(`Failed to update order status: ${error.message}`);
    }

    return data?.[0] || { id: orderId, status: newStatus };
  }
};
