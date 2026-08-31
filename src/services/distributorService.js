import { supabase } from '../lib/supabase';
import { initialDistributors } from '../data/distributorsData';

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
    try {
      const { data, error } = await supabase
        .from('distributors')
        .select('*')
        .order('created_at', { ascending: true });

      if (data && !error && data.length > 0) {
        saveLocalDistributors(data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase distributors query error, falling back to local:', err);
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
      target: parseInt(distributorData.target) || 0,
      outstanding: distributorData.outstanding || '₹0',
      pay: distributorData.pay || 'paid',
      phone: distributorData.phone || '',
      gstin: distributorData.gstin || '',
      billing: distributorData.billing || '',
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('distributors')
        .update(payload)
        .eq('id', id)
        .select();

      if (!error && data?.[0]) {
        const local = getLocalDistributors();
        saveLocalDistributors(local.map((d) => (d.id === id ? data[0] : d)));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mittigold-distributor-updated'));
        }
        return data[0];
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
   * Update distributor payment status (paid or unpaid)
   */
  async updatePayment(id, newPay) {
    return this.update(id, { pay: newPay });
  },

  /**
   * Toggle distributor payment status (paid <-> unpaid)
   */
  async togglePayment(id, currentPay) {
    const newPay = currentPay === 'paid' ? 'unpaid' : 'paid';
    return this.update(id, { pay: newPay });
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
