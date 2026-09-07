import { supabase } from '../lib/supabase';

const EMPLOYEES_STORAGE_KEY = 'mittigold_employees_data';

function getLocalEmployees() {
  try {
    const stored = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return [];
}

function saveLocalEmployees(employees) {
  try {
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
  } catch (_) {}
}

export const employeeService = {
  /**
   * Fetch all employees from Supabase (or local storage if offline)
   */
  async getAll(filter = 'all') {
    try {
      let query = supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter && filter !== 'all' && (filter === 'active' || filter === 'inactive' || filter === 'on_leave')) {
        query = query.eq('status', filter);
      } else if (filter && filter !== 'all') {
        query = query.eq('zone', filter);
      }

      const { data, error } = await query;
      if (data && !error) {
        saveLocalEmployees(data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase employees query fallback to local:', err);
    }

    const local = getLocalEmployees();
    if (filter === 'all') return local;
    if (filter === 'active' || filter === 'inactive' || filter === 'on_leave') {
      return local.filter((e) => e.status === filter);
    }
    return local.filter((e) => e.zone === filter);
  },

  /**
   * Add a new employee
   */
  async add(empData) {
    const newEmp = {
      id: empData.id || `emp-${Date.now()}`,
      name: empData.name.trim(),
      role: empData.role || 'Field Sales Officer',
      zone: empData.zone || 'South Gujarat',
      city: empData.city || '',
      phone: empData.phone || '',
      email: empData.email || '',
      target_bags: parseInt(empData.target_bags, 10) || 1000,
      achieved_bags: parseInt(empData.achieved_bags, 10) || 0,
      leads_count: parseInt(empData.leads_count, 10) || 0,
      status: empData.status || 'active',
      joined_date: empData.joined_date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([newEmp])
        .select();

      if (!error && data?.[0]) {
        const local = getLocalEmployees();
        saveLocalEmployees([data[0], ...local]);
        this.notify();
        return data[0];
      }
    } catch (err) {
      console.warn('Supabase insert employee fallback to local:', err);
    }

    const local = getLocalEmployees();
    const updated = [newEmp, ...local];
    saveLocalEmployees(updated);
    this.notify();
    return newEmp;
  },

  /**
   * Update employee details
   */
  async update(empId, empData) {
    const payload = {
      name: empData.name.trim(),
      role: empData.role || 'Field Sales Officer',
      zone: empData.zone,
      city: empData.city,
      phone: empData.phone,
      email: empData.email,
      target_bags: parseInt(empData.target_bags, 10) || 1000,
      achieved_bags: parseInt(empData.achieved_bags, 10) || 0,
      leads_count: parseInt(empData.leads_count, 10) || 0,
      status: empData.status || 'active',
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('employees')
        .update(payload)
        .eq('id', empId)
        .select();

      if (!error && data?.[0]) {
        const local = getLocalEmployees();
        saveLocalEmployees(local.map((e) => (e.id === empId ? data[0] : e)));
        this.notify();
        return data[0];
      }
    } catch (err) {
      console.warn('Supabase update employee fallback to local:', err);
    }

    const local = getLocalEmployees();
    const merged = local.map((e) => (e.id === empId ? { ...e, ...payload } : e));
    saveLocalEmployees(merged);
    this.notify();
    return merged.find((e) => e.id === empId);
  },

  /**
   * Delete employee
   */
  async delete(empId) {
    try {
      await supabase
        .from('employees')
        .delete()
        .eq('id', empId);
    } catch (err) {
      console.warn('Supabase delete employee fallback to local:', err);
    }

    const local = getLocalEmployees();
    const filtered = local.filter((e) => e.id !== empId);
    saveLocalEmployees(filtered);
    this.notify();
    return true;
  },

  notify() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mittigold-employee-updated'));
    }
  }
};
