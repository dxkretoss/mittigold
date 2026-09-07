import { supabase } from '../lib/supabase';
import { initialInvoices } from '../data/invoicesData';
import { pad4 } from '../utils/helpers';

const INVOICES_STORAGE_KEY = 'mittigold_invoices_data';

function getLocalInvoices() {
  try {
    const stored = localStorage.getItem(INVOICES_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return [];
}

function saveLocalInvoices(invoices) {
  try {
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
  } catch (_) {}
}

export const invoiceService = {
  /**
   * Fetch all invoices from Supabase
   */
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formatted = data.map((item) => ({
          id: item.id,
          dist: item.dist,
          amt: item.amt,
          status: item.status || 'pending',
          date: item.date,
          gstRate: item.gst_rate ?? item.gstRate ?? 5,
          items: typeof item.items === 'string' ? JSON.parse(item.items) : (item.items || []),
          created_at: item.created_at
        })).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0) || String(b.id).localeCompare(String(a.id)));
        saveLocalInvoices(formatted);
        return formatted;
      }
    } catch (err) {
      console.warn('Supabase invoices query error:', err);
    }
    return getLocalInvoices().sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0) || String(b.id).localeCompare(String(a.id)));
  },

  /**
   * Calculate next sequential invoice ID (e.g. MG-INV-00232)
   */
  async getNextId() {
    const all = await this.getAll();
    const nums = all.map((o) => {
      const parts = String(o.id || '').split('-');
      return parseInt(parts[parts.length - 1]) || 0;
    });
    const max = nums.reduce((m, n) => Math.max(m, n), 231);
    return 'MG-INV-' + pad4(max + 1);
  },

  /**
   * Add a new invoice
   */
  async add(invoiceData) {
    const nextId = invoiceData.id || (await this.getNextId());
    const newInvoice = {
      id: nextId,
      dist: invoiceData.dist,
      amt: invoiceData.amt,
      status: invoiceData.status || 'pending',
      date: invoiceData.date,
      gst_rate: invoiceData.gstRate ?? 5,
      items: invoiceData.items || [],
      created_at: new Date().toISOString()
    };

    // 1. Try Supabase insert
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert([newInvoice])
        .select();

      if (!error && data?.[0]) {
        const saved = {
          ...newInvoice,
          gstRate: newInvoice.gst_rate
        };
        const local = getLocalInvoices();
        saveLocalInvoices([saved, ...local.filter((i) => i.id !== saved.id)]);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mittigold-invoice-created', { detail: saved }));
        }
        return saved;
      }
    } catch (err) {
      console.warn('Supabase invoice insert failed, persisting to local storage:', err);
    }

    // 2. Local fallback
    const fallback = {
      ...newInvoice,
      gstRate: newInvoice.gst_rate
    };
    const local = getLocalInvoices();
    saveLocalInvoices([fallback, ...local.filter((i) => i.id !== fallback.id)]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mittigold-invoice-created', { detail: fallback }));
    }
    return fallback;
  },

  /**
   * Update an existing invoice
   */
  async update(id, invoiceData) {
    const payload = {
      dist: invoiceData.dist,
      amt: invoiceData.amt,
      status: invoiceData.status || 'pending',
      date: invoiceData.date,
      gst_rate: invoiceData.gstRate ?? 5,
      items: invoiceData.items || [],
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('invoices')
        .update(payload)
        .eq('id', id)
        .select();

      if (!error && data?.[0]) {
        const saved = {
          id,
          ...payload,
          gstRate: payload.gst_rate
        };
        const local = getLocalInvoices();
        saveLocalInvoices(local.map((i) => (i.id === id ? { ...i, ...saved } : i)));
        return saved;
      }
    } catch (err) {
      console.warn('Supabase invoice update failed, saving locally:', err);
    }

    const fallback = {
      id,
      ...payload,
      gstRate: payload.gst_rate
    };
    const local = getLocalInvoices();
    saveLocalInvoices(local.map((i) => (i.id === id ? { ...i, ...fallback } : i)));
    return fallback;
  },

  /**
   * Update invoice payment status (paid, pending, unpaid)
   */
  async updateStatus(id, newStatus) {
    try {
      await supabase
        .from('invoices')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (err) {
      console.warn('Failed to update invoice status in Supabase:', err);
    }

    const local = getLocalInvoices();
    const updated = local.map((inv) => (inv.id === id ? { ...inv, status: newStatus } : inv));
    saveLocalInvoices(updated);
    return updated.find((inv) => inv.id === id);
  },

  /**
   * Delete invoice
   */
  async delete(id) {
    try {
      await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
    } catch (err) {
      console.warn('Failed to delete invoice in Supabase:', err);
    }

    const local = getLocalInvoices();
    const filtered = local.filter((inv) => inv.id !== id);
    saveLocalInvoices(filtered);
    return true;
  }
};
