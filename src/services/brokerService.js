import { supabase } from '../lib/supabase';
import { orderService } from './orderService';

const BROKERS_STORAGE_KEY = 'mittigold_brokers_data';
const BROKER_PAYMENTS_KEY = 'mittigold_broker_payments';

function getLocalBrokers() {
  try {
    const stored = localStorage.getItem(BROKERS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return [];
}

function saveLocalBrokers(brokers) {
  try {
    localStorage.setItem(BROKERS_STORAGE_KEY, JSON.stringify(brokers));
  } catch (_) {}
}

function getLocalPayments() {
  try {
    const stored = localStorage.getItem(BROKER_PAYMENTS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return [];
}

function saveLocalPayments(payments) {
  try {
    localStorage.setItem(BROKER_PAYMENTS_KEY, JSON.stringify(payments));
  } catch (_) {}
}

/**
 * Custom Service Functions for Brokers
 * 100% Dynamic Supabase queries with Commission Payment Ledger & Orders Integration
 */
export const brokerService = {
  /**
   * Fetch all brokers from Supabase database
   */
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('brokers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        saveLocalBrokers(data);
        return data;
      }
    } catch (err) {
      console.warn('Failed to load brokers from Supabase:', err.message);
    }

    return getLocalBrokers();
  },

  /**
   * Add a new broker to Supabase database
   */
  async add(brokerData) {
    const newBroker = {
      id: brokerData.id || `broker-${Date.now()}`,
      name: brokerData.name,
      phone: brokerData.phone || '',
      rate: brokerData.rate !== undefined ? Number(brokerData.rate) : 5,
      orders: brokerData.orders !== undefined ? Number(brokerData.orders) : 0,
      commission: brokerData.commission || '₹0',
      paid: brokerData.paid || '₹0',
      pending: brokerData.pending || '₹0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('brokers')
        .insert([newBroker])
        .select();

      if (!error && data?.[0]) {
        const local = getLocalBrokers();
        saveLocalBrokers([data[0], ...local.filter((b) => b.id !== data[0].id)]);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mittigold-broker-created'));
        }
        return data[0];
      }
    } catch (err) {
      console.warn('Supabase broker insert failed, saving locally:', err);
    }

    const local = getLocalBrokers();
    const updated = [newBroker, ...local.filter((b) => b.id !== newBroker.id)];
    saveLocalBrokers(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mittigold-broker-created'));
    }
    return newBroker;
  },

  /**
   * Update an existing broker in Supabase
   */
  async update(brokerId, updateData) {
    const payload = {
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('brokers')
        .update(payload)
        .eq('id', brokerId)
        .select();

      if (!error && data?.[0]) {
        const local = getLocalBrokers();
        const updated = local.map((b) => (b.id === brokerId ? { ...b, ...data[0] } : b));
        saveLocalBrokers(updated);
        return data[0];
      }
    } catch (err) {
      console.warn('Supabase broker update failed, updating locally:', err);
    }

    const local = getLocalBrokers();
    const updated = local.map((b) => (b.id === brokerId ? { ...b, ...payload } : b));
    saveLocalBrokers(updated);
    return updated.find((b) => b.id === brokerId) || null;
  },

  /**
   * Delete a broker from Supabase database
   */
  async delete(brokerId) {
    try {
      await supabase.from('brokers').delete().eq('id', brokerId);
    } catch (err) {
      console.warn('Supabase broker delete error:', err);
    }

    const local = getLocalBrokers();
    saveLocalBrokers(local.filter((b) => b.id !== brokerId));
    return true;
  },

  /**
   * Fetch all commission payment records for a broker
   */
  async getPayments(brokerId, brokerName) {
    const allPayments = getLocalPayments();
    const cleanId = String(brokerId || '').toLowerCase();
    const cleanName = String(brokerName || '').toLowerCase().trim();

    return allPayments
      .filter((p) => {
        const pId = String(p.broker_id || p.distributor_id || '').toLowerCase();
        const pName = String(p.broker_name || p.distributor_name || '').toLowerCase().trim();
        return (
          pId === cleanId ||
          pName === cleanName ||
          (cleanName && pName && (cleanName.includes(pName) || pName.includes(cleanName)))
        );
      })
      .sort((a, b) => new Date(b.created_at || b.payment_date || 0) - new Date(a.created_at || a.payment_date || 0));
  },

  /**
   * Record a new commission payout to a broker with screenshot proof
   */
  async addPayment(brokerId, paymentData) {
    const brokers = await this.getAll();
    const broker = brokers.find((b) => b.id === brokerId || String(b.id) === String(brokerId));

    const numAmount = parseFloat(String(paymentData.amount).replace(/[^0-9.]/g, '')) || 0;

    const newPayment = {
      id: `broker-pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      broker_id: brokerId,
      broker_name: broker?.name || 'Broker',
      amount: `₹${numAmount.toLocaleString('en-IN')}`,
      amountNum: numAmount,
      payment_date: paymentData.payment_date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      payment_mode: paymentData.payment_mode || 'UPI / QR',
      payment_ref: paymentData.payment_ref || '',
      payment_proof: paymentData.payment_proof || '',
      payment_notes: paymentData.payment_notes || '',
      created_at: new Date().toISOString(),
    };

    const allPayments = getLocalPayments();
    allPayments.unshift(newPayment);
    saveLocalPayments(allPayments);

    // Update broker's paid & pending balances
    if (broker) {
      const currentPaid = parseFloat(String(broker.paid || '').replace(/[^0-9.]/g, '')) || 0;
      const totalEarned = parseFloat(String(broker.commission || '').replace(/[^0-9.]/g, '')) || 0;

      const newPaid = currentPaid + numAmount;
      const newPending = Math.max(0, totalEarned - newPaid);

      await this.update(broker.id, {
        paid: `₹${newPaid.toLocaleString('en-IN')}`,
        pending: `₹${newPending.toLocaleString('en-IN')}`,
      });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mittigold-broker-payment-created', { detail: newPayment }));
    }

    return newPayment;
  },

  /**
   * Delete a commission payment record
   */
  async deletePayment(paymentId, brokerId) {
    const allPayments = getLocalPayments();
    const target = allPayments.find((p) => p.id === paymentId);
    const filtered = allPayments.filter((p) => p.id !== paymentId);
    saveLocalPayments(filtered);

    if (target && brokerId) {
      const brokers = await this.getAll();
      const broker = brokers.find((b) => b.id === brokerId || String(b.id) === String(brokerId));
      if (broker) {
        const deletedAmt = target.amountNum || parseFloat(String(target.amount || '').replace(/[^0-9.]/g, '')) || 0;
        const currentPaid = parseFloat(String(broker.paid || '').replace(/[^0-9.]/g, '')) || 0;
        const totalEarned = parseFloat(String(broker.commission || '').replace(/[^0-9.]/g, '')) || 0;

        const newPaid = Math.max(0, currentPaid - deletedAmt);
        const newPending = Math.max(0, totalEarned - newPaid);

        await this.update(broker.id, {
          paid: `₹${newPaid.toLocaleString('en-IN')}`,
          pending: `₹${newPending.toLocaleString('en-IN')}`,
        });
      }
    }

    return true;
  },

  /**
   * Fetch complete 360-degree details for a broker:
   * Profile + Sourced Orders breakdown + Commission Ledger
   */
  async getDetails(brokerId) {
    const allBrokers = await this.getAll();
    const cleanId = String(brokerId || '').trim();

    const broker = allBrokers.find(
      (b) => b.id === brokerId || String(b.id) === cleanId || (b.name && b.name.trim().toLowerCase() === cleanId.toLowerCase())
    );
    if (!broker) return null;

    const brokerName = (broker.name || '').trim().toLowerCase();

    // 1. Fetch all orders strictly sourced by this broker
    let orders = [];
    try {
      const allOrders = await orderService.getAll('all');
      orders = allOrders.filter((o) => {
        const oBroker = String(o.broker || o.broker_name || '').trim().toLowerCase();
        const oDist = String(o.dist || '').trim().toLowerCase();
        return (
          (oBroker && oBroker === brokerName) ||
          (oBroker && brokerName && (oBroker.includes(brokerName) || brokerName.includes(oBroker))) ||
          (brokerName && oDist === brokerName)
        );
      });
    } catch (_) {
      orders = [];
    }

    // 2. Fetch payment ledger & receipts
    const payments = await this.getPayments(broker.id, broker.name);

    return {
      broker,
      orders,
      payments,
      summary: {
        totalOrders: orders.length,
        commissionEarned: broker.commission || '₹0',
        totalPaid: broker.paid || '₹0',
        totalPending: broker.pending || '₹0',
        paymentReceiptsCount: payments.length,
      },
    };
  },
};
