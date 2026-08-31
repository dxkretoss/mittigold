import { supabase } from '../lib/supabase';

const AUTH_STORAGE_KEY = 'mittigold_auth_session';

/**
 * Custom authentication query directly against Supabase profiles table
 */
async function authenticateWithSupabase(email, password) {
  const normalizedEmail = (email || '').trim().toLowerCase();

  // 1. Try Custom RPC function if configured in SQL
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('custom_login', {
      p_email: normalizedEmail,
      p_password: password
    });

    if (!rpcError && rpcData) {
      if (rpcData.success && rpcData.user) {
        return rpcData.user;
      }
      if (rpcData.message) {
        throw new Error(rpcData.message);
      }
    }
  } catch (err) {
    if (err.message && !err.message.includes('function') && !err.message.includes('not found')) {
      throw err;
    }
  }

  // 2. Direct table query against profiles table
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, role, company, initials, phone, city, is_active, password')
    .ilike('email', normalizedEmail)
    .limit(1);

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('User not found. Please check your admin credentials.');
  }

  const user = data[0];

  if (user.is_active === false) {
    throw new Error('This account has been deactivated.');
  }

  if (user.password !== password) {
    throw new Error('Incorrect password. Please try again.');
  }

  const { password: _, ...userSafe } = user;
  return userSafe;
}

export const authService = {
  /**
   * Custom Login function
   * 100% Dynamic - Verifies credentials strictly against Supabase profiles table
   */
  async login(email, password) {
    const cleanEmail = (email || '').trim();

    // Authenticate with live Supabase database
    const authenticatedUser = await authenticateWithSupabase(cleanEmail, password);

    if (!authenticatedUser) {
      throw new Error('Authentication failed.');
    }

    // Role check: Web portal is restricted to Admin only
    if (authenticatedUser.role !== 'admin') {
      throw new Error('Access restricted: Web portal is for Administrators only.');
    }

    // Save active session for Admin
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
    return authenticatedUser;
  },

  async logout() {
    await new Promise(resolve => setTimeout(resolve, 50));
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return true;
  },

  getCurrentUser() {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    const user = this.getCurrentUser();
    return !!user && user.role === 'admin';
  }
};
