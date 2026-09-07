import { supabase } from '../lib/supabase';
import { initialDistributors } from '../data/distributorsData';
import { notificationService } from './notificationService';

const DISTRIBUTORS_STORAGE_KEY = 'mittigold_distributors_data';
const DISTRIBUTOR_PAYMENTS_KEY = 'mittigold_distributor_payments';

function getLocalDistributors() {
  try {
    const stored = localStorage.getItem(DISTRIBUTORS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return [];
}

function saveLocalDistributors(distributors) {
  try {
    localStorage.setItem(DISTRIBUTORS_STORAGE_KEY, JSON.stringify(distributors));
  } catch (_) {}
}

function getLocalPayments() {
  try {
    const stored = localStorage.getItem(DISTRIBUTOR_PAYMENTS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return [];
}

function saveLocalPayments(payments) {
  try {
    localStorage.setItem(DISTRIBUTOR_PAYMENTS_KEY, JSON.stringify(payments));
  } catch (_) {}
}

export const distributorService = {
  /**
   * Fetch all distributors from Supabase
   */
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('distributors')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        saveLocalDistributors(data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase distributors query error:', err);
    }
    return getLocalDistributors();
  },

  /**
   * Fetch top performing distributors for dashboard
   */
  async getBest(limit = 5) {
    const all = await this.getAll();
    return [...all]
      .sort((a, b) => (b.target || 0) - (a.target || 0))
      .slice(0, limit);
  },

  /**
   * Add a new distributor
   */
  async add(distributorData) {
    const newDist = {
      id: distributorData.id || `dist-${Date.now()}`,
      name: distributorData.name,
      zone: distributorData.zone,
      city: distributorData.city,
      area: distributorData.area,
      target: parseInt(distributorData.target) || 0,
      outstanding: distributorData.outstanding || '₹0',
      pay: distributorData.pay || 'paid',
      phone: distributorData.phone || '',
      gstin: distributorData.gstin || '',
      billing: distributorData.billing || '',
      reference_type: distributorData.reference_type || 'company',
      reference_id: distributorData.reference_id || null,
      reference_name: distributorData.reference_name || 'Company Own',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('distributors')
        .insert([newDist])
        .select();

      if (!error && data?.[0]) {
        const local = getLocalDistributors();
        saveLocalDistributors([data[0], ...local.filter(d => d.id !== data[0].id)]);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mittigold-distributor-created'));
        }
        return data[0];
      }
    } catch (err) {
      console.warn('Supabase distributor insert failed, saving locally:', err);
    }

    const local = getLocalDistributors();
    const updated = [newDist, ...local.filter(d => d.id !== newDist.id)];
    saveLocalDistributors(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mittigold-distributor-created'));
    }
    return newDist;
  },

  /**
   * Update an existing distributor
   */
  async update(id, distributorData) {
    const payload = {
      name: distributorData.name,
      zone: distributorData.zone,
      city: distributorData.city,
      area: distributorData.area,
      target: distributorData.target !== undefined ? (parseInt(distributorData.target) || 0) : undefined,
      outstanding: distributorData.outstanding !== undefined ? distributorData.outstanding : undefined,
      pay: distributorData.pay !== undefined ? distributorData.pay : undefined,
      phone: distributorData.phone !== undefined ? distributorData.phone : undefined,
      gstin: distributorData.gstin !== undefined ? distributorData.gstin : undefined,
      billing: distributorData.billing !== undefined ? distributorData.billing : undefined,
      reference_type: distributorData.reference_type !== undefined ? distributorData.reference_type : undefined,
      reference_id: distributorData.reference_id !== undefined ? distributorData.reference_id : undefined,
      reference_name: distributorData.reference_name !== undefined ? distributorData.reference_name : undefined,
      payment_proof: distributorData.payment_proof !== undefined ? distributorData.payment_proof : undefined,
      payment_date: distributorData.payment_date !== undefined ? distributorData.payment_date : undefined,
      payment_mode: distributorData.payment_mode !== undefined ? distributorData.payment_mode : undefined,
      payment_ref: distributorData.payment_ref !== undefined ? distributorData.payment_ref : undefined,
      payment_notes: distributorData.payment_notes !== undefined ? distributorData.payment_notes : undefined,
      updated_at: new Date().toISOString()
    };

    // Clean undefined keys
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    try {
      let { data, error } = await supabase
        .from('distributors')
        .update(payload)
        .eq('id', id)
        .select();

      // Graceful fallback if any columns not in remote Supabase table schema cache
      if (
        error &&
        (error.code === 'PGRST204' ||
          error.code === '42703' ||
          error.message?.toLowerCase().includes('column') ||
          error.message?.toLowerCase().includes('schema cache'))
      ) {
        console.warn('Columns not in remote Supabase table schema cache. Saving locally and updating basic fields in Supabase:', error.message);
        const fallbackPayload = { ...payload };
        delete fallbackPayload.payment_proof;
        delete fallbackPayload.payment_date;
        delete fallbackPayload.payment_mode;
        delete fallbackPayload.payment_ref;
        delete fallbackPayload.payment_notes;
        delete fallbackPayload.reference_type;
        delete fallbackPayload.reference_id;
        delete fallbackPayload.reference_name;

        try {
          const retry = await supabase
            .from('distributors')
            .update(fallbackPayload)
            .eq('id', id)
            .select();

          data = retry.data;
          error = retry.error;
        } catch (_) {}
      }

      if (data?.[0]) {
        const fullSaved = { ...data[0], ...payload };
        const local = getLocalDistributors();
        saveLocalDistributors(local.map((d) => (d.id === id ? fullSaved : d)));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mittigold-distributor-updated'));
        }
        return fullSaved;
      }
    } catch (err) {
      console.warn('Supabase distributor update failed, saving locally:', err);
    }

    const local = getLocalDistributors();
    const merged = local.map((d) => (d.id === id ? { ...d, ...payload } : d));
    saveLocalDistributors(merged);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mittigold-distributor-updated'));
    }
    return merged.find((d) => d.id === id);
  },

  /**
   * Update distributor payment status and proof
   */
  async updatePayment(id, newPay, proofData = {}) {
    const payload = {
      pay: newPay,
    };
    if (newPay === 'paid') {
      if (proofData.payment_proof !== undefined) payload.payment_proof = proofData.payment_proof;
      if (proofData.payment_date !== undefined) payload.payment_date = proofData.payment_date;
      if (proofData.payment_mode !== undefined) payload.payment_mode = proofData.payment_mode;
      if (proofData.payment_ref !== undefined) payload.payment_ref = proofData.payment_ref;
      if (proofData.payment_notes !== undefined) payload.payment_notes = proofData.payment_notes;

      try {
        const local = getLocalDistributors();
        const distName = local.find(d => d.id === id)?.name || 'Distributor';
        notificationService.add({
          type: 'payment',
          title: 'Payment Cleared',
          message: `${distName} payment record and proof verified as Paid.`,
          link: '/distributors',
        }).catch(() => {});
      } catch (_) {}
    } else {
      payload.payment_proof = null;
    }
    return this.update(id, payload);
  },

  /**
   * Toggle distributor payment status (paid <-> unpaid)
   */
  async togglePayment(id, currentPay) {
    const newPay = currentPay === 'paid' ? 'unpaid' : 'paid';
    return this.updatePayment(id, newPay);
  },

  /**
   * Delete a distributor
   */
  async delete(id) {
    try {
      await supabase
        .from('distributors')
        .delete()
        .eq('id', id);
    } catch (err) {
      console.warn('Supabase distributor delete failed:', err);
    }

    const local = getLocalDistributors();
    const all = await this.getAll();
    const filtered = all.filter((d) => d.id !== id && String(d.id) !== String(id));

    try {
      await supabase.from('distributors').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete distributor fallback to local:', err);
    }

    saveLocalDistributors(filtered);
    this.notify('deleted', { id });
    return true;
  },

  /**
   * Update payment status and proof
   */
  async updatePayment(id, status, proofData = null) {
    const payload = {
      pay: status,
    };
    if (proofData) {
      payload.payment_proof = proofData.payment_proof || null;
      payload.payment_date = proofData.payment_date || null;
      payload.payment_mode = proofData.payment_mode || null;
      payload.payment_ref = proofData.payment_ref || null;
      payload.payment_notes = proofData.payment_notes || null;
    }
    return this.update(id, payload);
  },

  /**
   * Fetch all payment records for a distributor
   */
  async getPayments(distributorId, distName = '') {
    const allPayments = getLocalPayments();
    let distPayments = allPayments.filter(
      (p) =>
        p.distributorId === distributorId ||
        String(p.distributorId) === String(distributorId) ||
        (distName && (p.distributorName || '').toLowerCase() === distName.toLowerCase())
    );

    return distPayments.sort((a, b) => new Date(b.created_at || b.payment_date) - new Date(a.created_at || a.payment_date));
  },

  /**
   * Add a new payment record for a distributor with screenshot proof
   */
  async addPayment(distributorId, paymentData) {
    const allDistributors = await this.getAll();
    const dist = allDistributors.find((d) => d.id === distributorId || String(d.id) === String(distributorId));
    if (!dist) throw new Error('Distributor not found');

    const numAmount = typeof paymentData.amount === 'number'
      ? paymentData.amount
      : parseFloat(String(paymentData.amount).replace(/[^0-9.]/g, '')) || 0;

    const newPayment = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      distributorId: dist.id,
      distributorName: dist.name,
      amount: `₹${numAmount.toLocaleString('en-IN')}`,
      amountNum: numAmount,
      payment_date: paymentData.payment_date || new Date().toISOString(),
      payment_mode: paymentData.payment_mode || 'UPI',
      payment_ref: paymentData.payment_ref || '',
      payment_proof: paymentData.payment_proof || null,
      payment_notes: paymentData.payment_notes || '',
      created_at: new Date().toISOString(),
    };

    const allPayments = getLocalPayments();
    saveLocalPayments([newPayment, ...allPayments]);
    
    await this.updatePayment(dist.id, 'paid', newPayment);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mittigold-payment-created', { detail: newPayment }));
    }
    return newPayment;
  },

  /**
   * Delete a payment record
   */
  async deletePayment(paymentId, distributorId) {
    const allPayments = getLocalPayments();
    const filtered = allPayments.filter((p) => p.id !== paymentId);
    saveLocalPayments(filtered);
    return true;
  },

  /**
   * Fetch complete 360-degree details for a distributor:
   * Profile + Orders breakdown + Invoices + Payment Ledger
   */
  async getDetails(distributorId) {
    const allDistributors = await this.getAll();
    const cleanId = String(distributorId || '').trim();
    const decodedName = decodeURIComponent(cleanId).toLowerCase();

    const distributor = allDistributors.find(
      (d) =>
        d.id === distributorId ||
        String(d.id) === cleanId ||
        (d.name && d.name.trim().toLowerCase() === decodedName)
    );
    if (!distributor) return null;

    const distName = (distributor.name || '').trim().toLowerCase();
    const distId = String(distributor.id || '').toLowerCase();

    // 1. Fetch all orders for this distributor via orderService
    let orders = [];
    try {
      const allOrders = await orderService.getAll('all');
      orders = allOrders.filter((o) => {
        const orderDist = (o.dist || o.distributor || o.distributor_name || '').trim().toLowerCase();
        const orderDistId = String(o.dist_id || o.distributor_id || '').toLowerCase();

        return (
          orderDist === distName ||
          (orderDistId && orderDistId === distId) ||
          (orderDist && distName && (orderDist.includes(distName) || distName.includes(orderDist)))
        );
      });
    } catch (_) {
      orders = [];
    }

    // 2. Fetch all invoices for this distributor via invoiceService
    let invoices = [];
    try {
      const allInvoices = await invoiceService.getAll();
      invoices = allInvoices.filter((inv) => {
        const invDist = (inv.dist || inv.distributor || '').trim().toLowerCase();
        return (
          invDist === distName ||
          (invDist && distName && (invDist.includes(distName) || distName.includes(invDist)))
        );
      });
    } catch (_) {
      invoices = [];
    }

    // 3. Fetch payment history & receipts
    const payments = await this.getPayments(distributor.id, distributor.name);

    // Compute summary metrics
    const deliveredOrders = orders.filter((o) => o.status === 'delivered');
    const pendingOrders = orders.filter((o) => o.status !== 'delivered');

    // Total invoiced
    const totalInvoiced = invoices.reduce((sum, inv) => {
      const num = parseFloat(String(inv.amt || '').replace(/[^0-9.]/g, '')) || 0;
      return sum + num;
    }, 0);

    // Total paid
    const totalPaid = payments.reduce((sum, p) => {
      const num = p.amountNum || parseFloat(String(p.amount || '').replace(/[^0-9.]/g, '')) || 0;
      return sum + num;
    }, 0);

    return {
      distributor,
      orders,
      invoices,
      payments,
      summary: {
        totalOrders: orders.length,
        deliveredOrdersCount: deliveredOrders.length,
        pendingOrdersCount: pendingOrders.length,
        totalInvoices: invoices.length,
        totalPayments: payments.length,
        totalInvoiced,
        totalPaid,
      }
    };
  },

  notify(eventType, data) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mittigold-distributor-updated', { detail: { eventType, data } }));
    }
  }
};
