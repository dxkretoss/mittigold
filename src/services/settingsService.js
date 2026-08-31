import { supabase } from '../lib/supabase';
import { initialCompanySettings } from '../data/companySettingsData';

const SETTINGS_KEY = 'mittigold_company_invoice_settings';
const DEFAULT_ROW_ID = '00000000-0000-0000-0000-000000000001';

export const settingsService = {
  async getSettings() {
    try {
      // 1. Try Supabase cloud table first
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        const formatted = {
          name: data.name || initialCompanySettings.name,
          legal: data.legal || initialCompanySettings.legal,
          gstin: data.gstin || initialCompanySettings.gstin,
          address: data.address || initialCompanySettings.address,
          email: data.email || initialCompanySettings.email,
          phone: data.phone || initialCompanySettings.phone,
          defaultGst: data.default_gst ?? initialCompanySettings.defaultGst,
          invoicePrefix: data.invoice_prefix || initialCompanySettings.invoicePrefix,
        };
        try {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(formatted));
        } catch (_) {}
        return formatted;
      }
    } catch (err) {
      console.warn('Supabase settings query error, falling back to local:', err);
    }

    // 2. Fallback to LocalStorage
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...initialCompanySettings, ...JSON.parse(stored) };
      }
    } catch (err) {
      console.warn('Failed to load settings from localStorage:', err);
    }

    return { ...initialCompanySettings };
  },

  async updateSettings(newSettings) {
    const payload = {
      name: newSettings.name,
      legal: newSettings.legal,
      gstin: newSettings.gstin,
      address: newSettings.address,
      email: newSettings.email,
      phone: newSettings.phone,
      default_gst: newSettings.defaultGst,
      invoice_prefix: newSettings.invoicePrefix,
      updated_at: new Date().toISOString()
    };

    // 1. Update Supabase
    try {
      await supabase
        .from('company_settings')
        .upsert([{ id: DEFAULT_ROW_ID, ...payload }], { onConflict: 'id' });
    } catch (err) {
      console.warn('Could not update Supabase company_settings:', err);
    }

    // 2. Keep localStorage in sync
    try {
      const current = await this.getSettings();
      const merged = { ...current, ...newSettings, lastUpdated: new Date().toISOString() };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      return merged;
    } catch (err) {
      return { ...initialCompanySettings, ...newSettings };
    }
  },

  async resetSettings() {
    try {
      localStorage.removeItem(SETTINGS_KEY);
    } catch (err) {
      console.warn('Failed to reset settings in localStorage:', err);
    }
    return { ...initialCompanySettings };
  }
};


