import { supabase } from '../lib/supabase';
import { initialDistributors } from '../data/distributorsData';
import { notificationService } from './notificationService';

const DISTRIBUTORS_STORAGE_KEY = 'mittigold_distributors_data';

function getLocalDistributors() {
  try {
    const stored = localStorage.getItem(DISTRIBUTORS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return [...initialDistributors];
}

function saveLocalDistributors(distributors) {
  try {
    localStorage.setItem(DISTRIBUTORS_STORAGE_KEY, JSON.stringify(distributors));
  } catch (_) {}
}

export const distributorService = {
  /**
   * Fetch all distributors from Supabase (with localStorage fallback)
   */
  async getAll() {
    const local = getLocalDistributors();
    try {
      const { data, error } = await supabase
        .from('distributors')
        .select('*')
        .order('created_at', { ascending: true });

      if (data && !error && data.length > 0) {
        const remoteIds = new Set(data.map(d => d.id));
        const localOnly = local.filter(l => l.id && !remoteIds.has(l.id));
        const merged = [
          ...data.map((remote) => {
            const matchedLocal = local.find((l) => l.id === remote.id);
            return {
              ...remote,
              payment_proof: remote.payment_proof || matchedLocal?.payment_proof || null,
              payment_date: remote.payment_date || matchedLocal?.payment_date || null,
              payment_mode: remote.payment_mode || matchedLocal?.payment_mode || 'UPI / QR',
              payment_ref: remote.payment_ref || matchedLocal?.payment_ref || null,
              payment_notes: remote.payment_notes || matchedLocal?.payment_notes || null,
            };
          }),
          ...localOnly
        ];
        saveLocalDistributors(merged);
        return merged;
      }
    } catch (err) {
      console.warn('Supabase distributors query error, falling back to local:', err);
    }
    return local;
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
        saveLocalDistributors([...local, data[0]]);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mittigold-distributor-created'));
        }
        return data[0];
      }
    } catch (err) {
      console.warn('Supabase distributor insert failed, saving locally:', err);
    }

    const local = getLocalDistributors();
    const updated = [...local, newDist];
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

      // Graceful fallback if payment_proof/payment_date/payment_ref/payment_notes/payment_mode columns not in Supabase schema cache
      if (
        error &&
        (error.code === 'PGRST204' ||
          error.code === '42703' ||
          error.message?.toLowerCase().includes('column') ||
          error.message?.toLowerCase().includes('schema cache'))
      ) {
        console.warn('Payment proof columns not in remote Supabase table schema cache. Saving proof locally and updating basic fields in Supabase:', error.message);
        const fallbackPayload = { ...payload };
        delete fallbackPayload.payment_proof;
        delete fallbackPayload.payment_date;
        delete fallbackPayload.payment_mode;
        delete fallbackPayload.payment_ref;
        delete fallbackPayload.payment_notes;

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
    const filtered = local.filter((d) => d.id !== id);
    saveLocalDistributors(filtered);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mittigold-distributor-deleted'));
    }
    return true;
  }
};
