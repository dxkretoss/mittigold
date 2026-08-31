import { supabase } from '../lib/supabase';

const NOTIFICATIONS_STORAGE_KEY = 'mittigold_notifications_data';

const initialNotifications = [
  {
    id: 'notif-1',
    type: 'order',
    title: 'New Order Received',
    message: 'Navsari Wholesale placed order MG-2026-0232 for 980 bags.',
    link: '/orders',
    read: false,
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    type: 'lead',
    title: 'New Lead Added',
    message: 'Vraj Kirana Store from South Gujarat was added by R. Joshi.',
    link: '/leads',
    read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    type: 'payment',
    title: 'Payment Cleared',
    message: 'Shree Umiya Traders payment proof verified and marked as Paid.',
    link: '/distributors',
    read: false,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-4',
    type: 'order',
    title: 'Order Dispatched',
    message: 'Order MG-2026-0230 is out for delivery via Tata Ace.',
    link: '/orders',
    read: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-5',
    type: 'lead',
    title: 'Lead Converted',
    message: 'Ganesh Provision moved to Convert stage.',
    link: '/leads',
    read: true,
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
];

function getLocalNotifications() {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  return [...initialNotifications];
}

function saveLocalNotifications(notifications) {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (_) {}
}

export const notificationService = {
  /**
   * Fetch all notifications from Supabase with localStorage fallback
   */
  async getAll(filter = 'all') {
    const local = getLocalNotifications();
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'unread') {
        query = query.eq('read', false);
      } else if (filter !== 'all') {
        query = query.eq('type', filter);
      }

      const { data, error } = await query;

      if (data && !error && data.length > 0) {
        saveLocalNotifications(data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase notifications query error, falling back to local:', err);
    }

    if (filter === 'unread') {
      return local.filter((n) => !n.read);
    }
    if (filter !== 'all') {
      return local.filter((n) => n.type === filter);
    }
    return local;
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount() {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', false);

      if (!error && typeof count === 'number') {
        return count;
      }
    } catch (_) {}

    const local = getLocalNotifications();
    return local.filter((n) => !n.read).length;
  },

  /**
   * Add a new notification
   */
  async add(notificationData) {
    const newNotif = {
      id: notificationData.id || `notif-${Date.now()}`,
      type: notificationData.type || 'order',
      title: notificationData.title,
      message: notificationData.message,
      link: notificationData.link || '/orders',
      read: false,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([newNotif])
        .select();

      if (!error && data?.[0]) {
        const local = getLocalNotifications();
        saveLocalNotifications([data[0], ...local]);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('mittigold-notifications-updated'));
        }
        return data[0];
      }
    } catch (err) {
      console.warn('Failed to insert notification in Supabase:', err);
    }

    const local = getLocalNotifications();
    const updated = [newNotif, ...local];
    saveLocalNotifications(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mittigold-notifications-updated'));
    }
    return newNotif;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id) {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
    } catch (_) {}

    const local = getLocalNotifications();
    const updated = local.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveLocalNotifications(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mittigold-notifications-updated'));
    }
    return true;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);
    } catch (_) {}

    const local = getLocalNotifications();
    const updated = local.map((n) => ({ ...n, read: true }));
    saveLocalNotifications(updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mittigold-notifications-updated'));
    }
    return true;
  },

  /**
   * Delete a notification
   */
  async delete(id) {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
    } catch (_) {}

    const local = getLocalNotifications();
    const filtered = local.filter((n) => n.id !== id);
    saveLocalNotifications(filtered);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mittigold-notifications-updated'));
    }
    return true;
  },

  /**
   * Clear all notifications
   */
  async clearAll() {
    try {
      await supabase
        .from('notifications')
        .delete()
        .neq('id', 'placeholder');
    } catch (_) {}

    saveLocalNotifications([]);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mittigold-notifications-updated'));
    }
    return true;
  },
};
