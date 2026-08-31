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
  },

  /**
   * Change password for current admin user
   * Verifies current password and updates password in Supabase profiles table
   */
  async changePassword({ currentPassword, newPassword, userEmail, userId }) {
    if (!currentPassword) {
      throw new Error('Please enter your current password.');
    }
    if (!newPassword) {
      throw new Error('Please enter a new password.');
    }
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long.');
    }
    if (currentPassword === newPassword) {
      throw new Error('New password cannot be the same as your current password.');
    }

    const currentUser = this.getCurrentUser();
    const emailToMatch = (userEmail || currentUser?.email || '').trim().toLowerCase();
    const idToMatch = userId || currentUser?.id;

    if (!emailToMatch && !idToMatch) {
      throw new Error('User session not found. Please log in again.');
    }

    // 1. Fetch profile to verify current password
    let query = supabase
      .from('profiles')
      .select('id, email, password, is_active')
      .limit(1);

    if (idToMatch) {
      query = query.eq('id', idToMatch);
    } else {
      query = query.ilike('email', emailToMatch);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Account not found in database.');
    }

    const profile = data[0];

    if (profile.is_active === false) {
      throw new Error('This account has been deactivated.');
    }

    if (profile.password !== currentPassword) {
      throw new Error('Incorrect current password. Please try again.');
    }

    // 2. Update password in Supabase profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        password: newPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (updateError) {
      throw new Error(`Failed to update password: ${updateError.message}`);
    }

    return { success: true, message: 'Password updated successfully.' };
  }
};
