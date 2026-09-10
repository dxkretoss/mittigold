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
 * Helper to credit sales amount to Employee or Commission to Broker
 * based on distributor's reference_type
 */
async function creditOrderReference(orderData, previousAmt = 0) {
  const currentAmt = parseFloat(String(orderData.amt || orderData.total || orderData.order_value || '0').replace(/[^0-9.]/g, '')) || 0;
  const deltaAmt = currentAmt - previousAmt;
  if (deltaAmt === 0 && previousAmt > 0) return;

  const distName = (orderData.dist || '').trim().toLowerCase();
  const distId = String(orderData.dist_id || '').toLowerCase();

  try {
    // 1. Fetch distributors to find the reference
    let distObj = null;
    try {
      const { data: dists } = await supabase.from('distributors').select('*');
      if (dists && dists.length > 0) {
        distObj = dists.find((d) => 
          (distId && String(d.id).toLowerCase() === distId) ||
          (d.name && d.name.trim().toLowerCase() === distName)
        );
      }
    } catch (_) {}

    if (!distObj) {
      try {
        const localDists = JSON.parse(localStorage.getItem('mittigold_distributors_data') || '[]');
        distObj = localDists.find((d) => 
          (distId && String(d.id).toLowerCase() === distId) ||
          (d.name && d.name.trim().toLowerCase() === distName)
        );
      } catch (_) {}
    }

    if (!distObj || !distObj.reference_type) return;

    const refType = String(distObj.reference_type).toLowerCase().trim();
    const refId = String(distObj.reference_id || '').toLowerCase().trim();
    const refName = String(distObj.reference_name || '').toLowerCase().trim();

    // CASE A: Reference is Employee -> Add order value to employee achieved sales
    if (refType === 'employee') {
      let employees = [];
      try {
        const { data } = await supabase.from('employees').select('*');
        if (data) employees = data;
      } catch (_) {}
      if (!employees.length) {
        try {
          employees = JSON.parse(localStorage.getItem('mittigold_employees_data') || '[]');
        } catch (_) {}
      }

      const targetEmp = employees.find((e) => 
        (refId && String(e.id).toLowerCase() === refId) ||
        (refName && e.name && e.name.trim().toLowerCase() === refName)
      );

      if (targetEmp) {
        const currentAchieved = parseInt(String(targetEmp.achieved_bags || 0).replace(/[^0-9.]/g, ''), 10) || 0;
        const newAchieved = Math.max(0, currentAchieved + Math.round(deltaAmt > 0 ? deltaAmt : currentAmt));

        try {
          await supabase.from('employees').update({
            achieved_bags: newAchieved,
            updated_at: new Date().toISOString()
          }).eq('id', targetEmp.id);
        } catch (_) {}

        try {
          const local = JSON.parse(localStorage.getItem('mittigold_employees_data') || '[]');
          const updated = local.map((e) => e.id === targetEmp.id ? { ...e, achieved_bags: newAchieved } : e);
          localStorage.setItem('mittigold_employees_data', JSON.stringify(updated));
        } catch (_) {}

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mittigold-employee-updated'));
        }
      }
    }

    // CASE B: Reference is Broker -> Add calculated commission based on broker's rate %
    else if (refType === 'broker') {
      let brokers = [];
      try {
        const { data } = await supabase.from('brokers').select('*');
        if (data) brokers = data;
      } catch (_) {}
      if (!brokers.length) {
        try {
          brokers = JSON.parse(localStorage.getItem('mittigold_brokers_data') || '[]');
        } catch (_) {}
      }

      const targetBroker = brokers.find((b) => 
        (refId && String(b.id).toLowerCase() === refId) ||
        (refName && b.name && b.name.trim().toLowerCase() === refName)
      );

      if (targetBroker) {
        const rate = Number(targetBroker.rate) || 5;
        const effectiveOrderAmt = deltaAmt > 0 ? deltaAmt : currentAmt;
        const commAmt = Math.round(effectiveOrderAmt * (rate / 100));

        const curComm = parseFloat(String(targetBroker.commission || '0').replace(/[^0-9.]/g, '')) || 0;
        const curPending = parseFloat(String(targetBroker.pending || '0').replace(/[^0-9.]/g, '')) || 0;
        const curOrders = parseInt(targetBroker.orders, 10) || 0;

        const newComm = curComm + commAmt;
        const newPending = curPending + commAmt;
        const newOrders = previousAmt > 0 ? curOrders : curOrders + 1;

        const updatePayload = {
          commission: `₹${newComm.toLocaleString('en-IN')}`,
          pending: `₹${newPending.toLocaleString('en-IN')}`,
          orders: newOrders,
          updated_at: new Date().toISOString()
        };

        try {
          await supabase.from('brokers').update(updatePayload).eq('id', targetBroker.id);
        } catch (_) {}

        try {
          const local = JSON.parse(localStorage.getItem('mittigold_brokers_data') || '[]');
          const updated = local.map((b) => b.id === targetBroker.id ? { ...b, ...updatePayload } : b);
          localStorage.setItem('mittigold_brokers_data', JSON.stringify(updated));
        } catch (_) {}

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mittigold-broker-updated'));
        }
      }
    }
  } catch (err) {
    console.warn('Error updating distributor reference commissions/achievements:', err);
  }
}

/**
 * Helper to update Distributor's outstanding balance when order is created, modified or deleted
 */
async function updateDistributorOutstanding(distNameOrId, deltaAmt) {
  if (!distNameOrId || deltaAmt === 0) return;
  const cleanTarget = String(distNameOrId).trim().toLowerCase();

  try {
    let distributors = [];
    try {
      const { data } = await supabase.from('distributors').select('*');
      if (data && data.length > 0) distributors = data;
    } catch (_) {}

    if (!distributors.length) {
      try {
        distributors = JSON.parse(localStorage.getItem('mittigold_distributors_data') || '[]');
      } catch (_) {}
    }

    const distObj = distributors.find((d) => 
      (d.id && String(d.id).toLowerCase() === cleanTarget) ||
      (d.name && d.name.trim().toLowerCase() === cleanTarget)
    );

    if (distObj) {
      const currentOutstanding = parseFloat(String(distObj.outstanding || '0').replace(/[^0-9.]/g, '')) || 0;
      const newOutstanding = Math.max(0, currentOutstanding + deltaAmt);
      const newPayStatus = newOutstanding === 0 ? 'paid' : 'unpaid';

      const updatePayload = {
        outstanding: `₹${newOutstanding.toLocaleString('en-IN')}`,
        pay: newPayStatus,
        updated_at: new Date().toISOString()
      };

      try {
        await supabase.from('distributors').update(updatePayload).eq('id', distObj.id);
      } catch (_) {}

      try {
        const local = JSON.parse(localStorage.getItem('mittigold_distributors_data') || '[]');
        const updated = local.map((d) => d.id === distObj.id ? { ...d, ...updatePayload } : d);
        localStorage.setItem('mittigold_distributors_data', JSON.stringify(updated));
      } catch (_) {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mittigold-distributor-updated', { detail: { id: distObj.id, ...updatePayload } }));
      }
    }
  } catch (err) {
    console.warn('Error updating distributor outstanding balance:', err);
  }
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
        const local = getLocalOrders();
        const merged = data.map((remote) => {
          const loc = local.find((l) => l.id === remote.id);
          const origQty = remote.original_qty || loc?.original_qty || null;
          const curQty = remote.qty || loc?.qty || '';
          const isAdjusted = Boolean(
            remote.is_adjusted ||
            loc?.is_adjusted ||
            (origQty && String(origQty).trim() && String(origQty).trim() !== String(curQty).trim())
          );

          return {
            ...loc,
            ...remote,
            items: remote.items || loc?.items || null,
            original_qty: origQty,
            original_items: remote.original_items || loc?.original_items || null,
            is_adjusted: isAdjusted,
            order_value: remote.order_value || remote.total || loc?.order_value,
            amt: remote.amt != null ? remote.amt : loc?.amt,
          };
        });

        if (filter === 'all') {
          saveLocalOrders(merged);
        }
        return merged;
      }
    } catch (err) {
      console.warn('Supabase orders query error:', err);
    }

    const local = getLocalOrders();
    if (filter && filter !== 'all') {
      return local.filter((o) => o.status === filter);
    }
    return local;
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
    
    // Auto-detect zone from orderData or distributor
    let zone = orderData.zone;
    if (!zone && orderData.dist) {
      try {
        const localDists = JSON.parse(localStorage.getItem('mittigold_distributors_data') || '[]');
        const found = localDists.find((d) => d.name === orderData.dist || d.id === orderData.dist);
        if (found?.zone) zone = found.zone;
      } catch (_) {}
    }
    if (!zone) zone = 'South Gujarat';

    const orderDate = orderData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const orderTotal = orderData.total || orderData.order_value || (orderData.amt ? `₹${Number(orderData.amt).toLocaleString('en-IN')}` : '₹0');
    const originalQty = orderData.original_qty || orderData.qty;
    const originalItems = orderData.original_items || orderData.items || null;
    const isAdjusted = Boolean(orderData.is_adjusted || (originalQty && String(originalQty).trim() !== String(orderData.qty).trim()));

    // Columns present in Supabase orders table schema
    const dbPayload = {
      id: nextId,
      dist: orderData.dist,
      zone: zone,
      date: orderDate,
      qty: orderData.qty,
      total: orderTotal,
      eta: orderData.eta || '—',
      transport: orderData.transport || '—',
      status: orderData.status || 'pending',
      items: orderData.items || null,
      original_qty: originalQty,
      original_items: originalItems,
      amt: orderData.amt !== undefined ? orderData.amt : null,
      order_value: orderTotal,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const fullOrder = {
      ...dbPayload,
      is_adjusted: isAdjusted,
    };

    const orderAmt = orderData.amt !== undefined && orderData.amt !== null ? Number(orderData.amt) : (parseFloat(String(orderTotal || '0').replace(/[^0-9.]/g, '')) || 0);

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
          original_qty: originalQty,
          original_items: originalItems,
          is_adjusted: isAdjusted,
          amt: orderData.amt !== undefined ? orderData.amt : null,
          order_value: orderTotal,
        };
        saveLocalOrders([savedItem, ...local.filter(o => o.id !== data[0].id)]);
        
        // Auto-credit distributor reference (Employee achievement or Broker commission)
        await creditOrderReference(orderData, 0);

        // Auto-update distributor outstanding balance
        await updateDistributorOutstanding(orderData.dist_id || orderData.dist, orderAmt);

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

    // Auto-credit distributor reference locally
    await creditOrderReference(orderData, 0);

    // Auto-update distributor outstanding balance locally
    await updateDistributorOutstanding(orderData.dist_id || orderData.dist, orderAmt);

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

    const isAdjusted = Boolean(
      orderData.is_adjusted ||
      (original_qty && String(original_qty).trim() && String(original_qty).trim() !== String(orderData.qty || existing?.qty).trim())
    );

    // Auto-detect zone
    let zone = orderData.zone || existing?.zone;
    if (!zone && orderData.dist) {
      try {
        const localDists = JSON.parse(localStorage.getItem('mittigold_distributors_data') || '[]');
        const found = localDists.find((d) => d.name === orderData.dist || d.id === orderData.dist);
        if (found?.zone) zone = found.zone;
      } catch (_) {}
    }
    if (!zone) zone = 'South Gujarat';

    const orderDate = orderData.date || existing?.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const orderTotal = orderData.total || orderData.order_value || existing?.total || existing?.order_value || (orderData.amt ? `₹${Number(orderData.amt).toLocaleString('en-IN')}` : '₹0');

    // Send valid columns in Supabase orders table
    const dbPayload = {
      dist: orderData.dist,
      zone: zone,
      date: orderDate,
      total: orderTotal,
      qty: orderData.qty,
      eta: orderData.eta,
      transport: orderData.transport || '—',
      status: orderData.status || 'pending',
      items: orderData.items !== undefined ? orderData.items : existing?.items || null,
      original_qty: original_qty,
      original_items: original_items,
      amt: orderData.amt !== undefined ? orderData.amt : existing?.amt,
      order_value: orderData.order_value || (orderData.amt ? `₹${orderData.amt.toLocaleString('en-IN')}` : existing?.order_value),
      updated_at: new Date().toISOString()
    };

    const prevAmt = existing?.amt !== undefined && existing?.amt !== null ? Number(existing.amt) : (parseFloat(String(existing?.total || existing?.order_value || '0').replace(/[^0-9.]/g, '')) || 0);
    const newAmt = orderData.amt !== undefined && orderData.amt !== null ? Number(orderData.amt) : (parseFloat(String(orderTotal || '0').replace(/[^0-9.]/g, '')) || 0);
    const prevDist = existing?.dist_id || existing?.dist;
    const newDist = orderData.dist_id || orderData.dist;

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
          is_adjusted: isAdjusted,
          amt: orderData.amt !== undefined ? orderData.amt : existing?.amt,
          order_value: orderData.order_value || (orderData.amt ? `₹${orderData.amt.toLocaleString('en-IN')}` : existing?.order_value),
        };
        saveLocalOrders([savedItem, ...local.filter(o => o.id !== data[0].id)]);
        
        await creditOrderReference(orderData, prevAmt);

        if (prevDist && newDist && String(prevDist).trim().toLowerCase() !== String(newDist).trim().toLowerCase()) {
          await updateDistributorOutstanding(prevDist, -prevAmt);
          await updateDistributorOutstanding(newDist, newAmt);
        } else {
          const delta = newAmt - prevAmt;
          if (delta !== 0) {
            await updateDistributorOutstanding(newDist || prevDist, delta);
          }
        }

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
      is_adjusted: isAdjusted,
      amt: orderData.amt !== undefined ? orderData.amt : existing?.amt,
      order_value: orderData.order_value || (orderData.amt ? `₹${orderData.amt.toLocaleString('en-IN')}` : existing?.order_value),
    };
    saveLocalOrders([savedFallback, ...local.filter(o => o.id !== orderId)]);
    
    await creditOrderReference(orderData, prevAmt);

    if (prevDist && newDist && String(prevDist).trim().toLowerCase() !== String(newDist).trim().toLowerCase()) {
      await updateDistributorOutstanding(prevDist, -prevAmt);
      await updateDistributorOutstanding(newDist, newAmt);
    } else {
      const delta = newAmt - prevAmt;
      if (delta !== 0) {
        await updateDistributorOutstanding(newDist || prevDist, delta);
      }
    }

    this.notify();
    return savedFallback;
  },

  /**
   * Delete an order directly from Supabase & local cache
   */
  async delete(orderId) {
    const local = getLocalOrders();
    const existing = local.find((o) => o.id === orderId);
    if (existing) {
      const orderAmt = existing.amt !== undefined && existing.amt !== null ? Number(existing.amt) : (parseFloat(String(existing.total || existing.order_value || '0').replace(/[^0-9.]/g, '')) || 0);
      if (orderAmt > 0) {
        await updateDistributorOutstanding(existing.dist_id || existing.dist, -orderAmt);
      }
    }

    try {
      await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
    } catch (err) {
      console.warn('Supabase delete order fallback to local:', err);
    }

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
