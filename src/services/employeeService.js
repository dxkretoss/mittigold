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
   * Fetch complete employee detail with associated distributors, leads, and orders
   */
  async getDetails(empId) {
    const all = await this.getAll();
    const cleanId = String(empId || '').trim();
    const decodedName = decodeURIComponent(cleanId).toLowerCase();

    const employee = all.find((e) =>
      e.id === empId ||
      String(e.id) === cleanId ||
      (e.name && e.name.trim().toLowerCase() === decodedName)
    );

    if (!employee) return null;

    // Fetch distributors, leads, and orders to gather relationships
    let allDistributors = [];
    let allLeads = [];
    let allOrders = [];

    try {
      const { data } = await supabase.from('distributors').select('*');
      if (data) allDistributors = data;
    } catch (_) {}
    if (!allDistributors.length) {
      try {
        allDistributors = JSON.parse(localStorage.getItem('mittigold_distributors_data') || '[]');
      } catch (_) {}
    }

    try {
      const { data } = await supabase.from('leads').select('*');
      if (data) allLeads = data;
    } catch (_) {}
    if (!allLeads.length) {
      try {
        allLeads = JSON.parse(localStorage.getItem('mittigold_leads_data') || '[]');
      } catch (_) {}
    }

    try {
      const { data } = await supabase.from('orders').select('*');
      if (data) allOrders = data;
    } catch (_) {}
    if (!allOrders.length) {
      try {
        allOrders = JSON.parse(localStorage.getItem('mittigold_orders_data') || '[]');
      } catch (_) {}
    }

    const empName = (employee.name || '').trim().toLowerCase();
    const empIdStr = String(employee.id || '').toLowerCase();
    const empLastName = empName.split(' ').pop() || '';

    // 1. Associated Distributors (where reference_type === 'employee' and reference matches this employee)
    const distributors = allDistributors.filter((d) => {
      const refType = String(d.reference_type || '').toLowerCase();
      const refId = String(d.reference_id || '').toLowerCase();
      const refName = String(d.reference_name || '').toLowerCase();
      return (
        refType === 'employee' &&
        ((refId && refId === empIdStr) || (refName && (refName === empName || (empLastName && empLastName.length >= 3 && refName.includes(empLastName)))))
      );
    });

    // 2. Associated Leads (where owner explicitly matches employee name)
    const leads = allLeads.filter((l) => {
      const owner = String(l.owner || '').trim().toLowerCase();
      return (
        owner === empName ||
        (empLastName && empLastName.length >= 3 && owner.includes(empLastName)) ||
        (empName.includes(owner) && owner.length >= 4)
      );
    });

    // 3. Associated Orders (only from assigned distributors)
    const distNames = new Set(distributors.map((d) => (d.name || '').trim().toLowerCase()));
    const distIds = new Set(distributors.map((d) => String(d.id || '').toLowerCase()));
    const orders = allOrders.filter((o) => {
      const oDist = (o.dist || '').trim().toLowerCase();
      const oDistId = String(o.dist_id || '').toLowerCase();
      return distNames.has(oDist) || (oDistId && distIds.has(oDistId));
    });

    const totalOrderSales = orders.reduce((sum, o) => {
      const val = parseFloat(String(o.total || o.order_value || o.amt || '0').replace(/[^0-9.]/g, '')) || 0;
      return sum + val;
    }, 0);

    const achieved = employee.achieved_bags != null ? Number(employee.achieved_bags) : totalOrderSales;

    return {
      employee: {
        ...employee,
        achieved_bags: achieved,
        leads_count: employee.leads_count != null ? Number(employee.leads_count) : leads.length,
      },
      distributors,
      leads,
      orders,
      summary: {
        totalDistributors: distributors.length,
        totalLeads: leads.length,
        totalOrders: orders.length,
        totalSales: totalOrderSales,
      }
    };
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
