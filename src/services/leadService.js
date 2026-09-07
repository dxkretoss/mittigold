import { supabase } from '../lib/supabase';
import { initialLeads } from '../data/leadsData';
import { notificationService } from './notificationService';

const LEADS_STORAGE_KEY = 'mittigold_leads_data';

function getLocalLeads() {
  try {
    const stored = localStorage.getItem(LEADS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return [];
}

function saveLocalLeads(leads) {
  try {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
  } catch (_) {}
}

export const leadService = {
  /**
   * Fetch all leads from Supabase (with optional stage filter)
   */
  async getAll(filter = 'all') {
    try {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter && filter !== 'all') {
        query = query.eq('stage', filter);
      }

      const { data, error } = await query;

      if (!error && data) {
        if (filter === 'all') {
          saveLocalLeads(data);
        }
        return data;
      }
    } catch (err) {
      console.warn('Failed to load leads from Supabase:', err);
    }

    const local = getLocalLeads();
    if (filter === 'all') return local;
    return local.filter((l) => l.stage === filter);
  },

  /**
   * Fetch recent leads for dashboard
   */
  async getRecent(limit = 4) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (data && !error && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('Failed to load recent leads:', err);
    }

    const local = getLocalLeads();
    return local.slice(0, limit);
  },

  /**
   * Update lead stage (New, Follow-up, Convert, Close)
   */
  async updateStage(leadId, newStage) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({
          stage: newStage,
          last: 'Just now',
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)
        .select();

      if (!error && data?.[0]) {
        const local = getLocalLeads();
        saveLocalLeads(local.map((l) => (l.id === leadId ? data[0] : l)));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mittigold-lead-updated'));
        }
        return { lead: data[0], changed: true };
      }
    } catch (err) {
      console.warn('Failed to update stage in Supabase:', err);
    }

    const local = getLocalLeads();
    const lead = local.find((l) => l.id === leadId);
    if (lead) {
      const changed = lead.stage !== newStage;
      lead.stage = newStage;
      lead.last = 'Just now';
      saveLocalLeads(local);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mittigold-lead-updated'));
      }
      return { lead, changed };
    }

    return { lead: null, changed: false };
  },

  /**
   * Add a new lead
   */
  async add(leadData) {
    const newLead = {
      id: leadData.id || `lead-${Date.now()}`,
      name: leadData.name.trim(),
      zone: leadData.zone,
      stage: leadData.stage || 'new',
      owner: leadData.owner || 'Admin',
      phone: leadData.phone || '',
      notes: leadData.notes || '',
      last: 'Today',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([newLead])
        .select();

      if (!error && data?.[0]) {
        const local = getLocalLeads();
        saveLocalLeads([data[0], ...local]);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mittigold-lead-created'));
        }
        return data[0];
      }
    } catch (err) {
      console.warn('Failed to add lead in Supabase:', err);
    }

    const local = getLocalLeads();
    const updated = [newLead, ...local];
    saveLocalLeads(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mittigold-lead-created'));
    }
    try {
      notificationService.add({
        type: 'lead',
        title: 'New Lead Added',
        message: `${newLead.name} (${newLead.zone}) was added to pipeline by ${newLead.owner}.`,
        link: '/leads',
      }).catch(() => {});
    } catch (_) {}

    return newLead;
  },

  /**
   * Update an existing lead
   */
  async update(leadId, leadData) {
    const payload = {
      name: leadData.name.trim(),
      zone: leadData.zone,
      stage: leadData.stage || 'new',
      owner: leadData.owner || 'Admin',
      phone: leadData.phone || '',
      notes: leadData.notes || '',
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('leads')
        .update(payload)
        .eq('id', leadId)
        .select();

      if (!error && data?.[0]) {
        const local = getLocalLeads();
        saveLocalLeads(local.map((l) => (l.id === leadId ? data[0] : l)));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mittigold-lead-updated'));
        }
        return data[0];
      }
    } catch (err) {
      console.warn('Failed to update lead in Supabase:', err);
    }

    const local = getLocalLeads();
    const merged = local.map((l) => (l.id === leadId ? { ...l, ...payload } : l));
    saveLocalLeads(merged);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mittigold-lead-updated'));
    }
    return merged.find((l) => l.id === leadId);
  },

  /**
   * Delete a lead
   */
  async delete(leadId) {
    try {
      await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);
    } catch (err) {
      console.warn('Failed to delete lead in Supabase:', err);
    }

    const local = getLocalLeads();
    const filtered = local.filter((l) => l.id !== leadId);
    saveLocalLeads(filtered);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mittigold-lead-updated'));
    }
    return true;
  },

  /**
   * Get total count of active leads
   */
  async getActiveCount() {
    try {
      const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      if (!error && typeof count === 'number') {
        return count;
      }
    } catch (_) {}

    const leads = await this.getAll('all');
    return leads.length;
  },
};
