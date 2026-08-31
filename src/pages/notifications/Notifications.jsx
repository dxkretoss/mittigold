import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Package,
  Users,
  CreditCard,
  Info,
  CheckCircle2,
  Trash2,
  CheckCheck,
  ArrowRight,
  Loader2,
  Filter,
} from 'lucide-react';
import { Skeleton } from '../../components/common/Skeleton';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { notificationService } from '../../services/notificationService';
import { useToast } from '../../hooks/useToast';

function formatRelativeTime(dateString) {
  if (!dateString) return 'Just now';
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay === 1) return 'Yesterday';
  return `${diffDay} days ago`;
}

const TYPE_CONFIG = {
  order: {
    icon: Package,
    bg: 'var(--amber-bg)',
    color: 'var(--amber)',
    badge: 'Order',
  },
  lead: {
    icon: Users,
    bg: 'var(--blue-bg)',
    color: 'var(--blue)',
    badge: 'Lead',
  },
  payment: {
    icon: CreditCard,
    bg: 'var(--green-bg)',
    color: 'var(--green)',
    badge: 'Payment',
  },
  system: {
    icon: Info,
    bg: 'var(--slate-bg)',
    color: 'var(--navy)',
    badge: 'System',
  },
};

export const Notifications = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [allNotifications, setAllNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getAll('all');
      setAllNotifications(data || []);
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    const handleUpdate = () => {
      loadNotifications();
    };

    window.addEventListener('mittigold-notifications-updated', handleUpdate);
    return () => {
      window.removeEventListener('mittigold-notifications-updated', handleUpdate);
    };
  }, []);

  const handleToggleRead = async (id, currentRead, e) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id, !currentRead);
      setAllNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: !currentRead } : n))
      );
      showSuccess(
        'Updated',
        !currentRead ? 'Marked as read.' : 'Marked as unread.'
      );
    } catch (err) {
      showError('Error', err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setAllNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showSuccess('Updated', 'All notifications marked as read.');
    } catch (err) {
      showError('Error', err.message);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationService.delete(id);
      setAllNotifications((prev) => prev.filter((n) => n.id !== id));
      showSuccess('Removed', 'Notification deleted.');
    } catch (err) {
      showError('Error', err.message);
    }
  };

  const handleConfirmClearAll = async () => {
    try {
      await notificationService.clearAll();
      setAllNotifications([]);
      showSuccess('Cleared', 'All notifications cleared.');
      setClearDialogOpen(false);
    } catch (err) {
      showError('Error', err.message);
    }
  };

  const filteredNotifications = React.useMemo(() => {
    if (filter === 'unread') return allNotifications.filter((n) => !n.read);
    if (filter === 'order') return allNotifications.filter((n) => n.type === 'order');
    if (filter === 'lead') return allNotifications.filter((n) => n.type === 'lead');
    if (filter === 'payment') return allNotifications.filter((n) => n.type === 'payment');
    return allNotifications;
  }, [allNotifications, filter]);

  const hasAnyData = allNotifications.length > 0;
  const unreadCount = allNotifications.filter((n) => !n.read).length;

  return (
    <div className="panel">
      {/* Header */}
      <div className="panel-head" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3>Activity &amp; Notifications</h3>
          <div className="hint">
            <b>{unreadCount} unread</b> · Real-time operational alerts for orders, leads &amp; payments
          </div>
        </div>

        {hasAnyData && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filter Tabs */}
            <div className="tabs">
              <button
                type="button"
                className={`tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`tab ${filter === 'unread' ? 'active' : ''}`}
                onClick={() => setFilter('unread')}
              >
                Unread
              </button>
              <button
                type="button"
                className={`tab ${filter === 'order' ? 'active' : ''}`}
                onClick={() => setFilter('order')}
              >
                Orders
              </button>
              <button
                type="button"
                className={`tab ${filter === 'lead' ? 'active' : ''}`}
                onClick={() => setFilter('lead')}
              >
                Leads
              </button>
              <button
                type="button"
                className={`tab ${filter === 'payment' ? 'active' : ''}`}
                onClick={() => setFilter('payment')}
              >
                Payments
              </button>
            </div>

            {/* Action Buttons */}
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn-outline"
                onClick={handleMarkAllRead}
                style={{ fontSize: '12px', padding: '6px 10px' }}
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}

            <button
              type="button"
              className="btn-outline"
              onClick={() => setClearDialogOpen(true)}
              style={{ fontSize: '12px', padding: '6px 10px', color: 'var(--red)' }}
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear all
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="panel-body" style={{ paddingTop: '8px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                  background: '#FFFFFF',
                }}
              >
                <Skeleton variant="circle" size="38px" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <Skeleton variant="text" width="60px" height="18px" />
                    <Skeleton variant="text" width="180px" height="18px" />
                  </div>
                  <Skeleton variant="text" width="65%" height="13px" />
                </div>
                <Skeleton variant="text" width="50px" height="12px" />
              </div>
            ))}
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredNotifications.map((notif) => {
              const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
              const IconComp = cfg.icon;

              return (
                <div
                  key={notif.id}
                  onClick={() => notif.link && navigate(notif.link)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '14px',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    background: notif.read ? '#FFFFFF' : 'rgba(200, 155, 60, 0.05)',
                    border: notif.read ? '1px solid var(--line)' : '1px solid rgba(200, 155, 60, 0.35)',
                    cursor: notif.link ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover:shadow-sm"
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                    {/* Type Icon */}
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '9px',
                        background: cfg.bg,
                        color: cfg.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: cfg.bg,
                            color: cfg.color,
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                          }}
                        >
                          {cfg.badge}
                        </span>

                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: notif.read ? 600 : 700,
                            color: 'var(--navy)',
                          }}
                        >
                          {notif.title}
                        </span>

                        {!notif.read && (
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: 'var(--wheat)',
                              display: 'inline-block',
                            }}
                          />
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: '13px',
                          color: notif.read ? 'var(--ink-soft)' : 'var(--ink)',
                          marginTop: '4px',
                          lineHeight: 1.45,
                        }}
                      >
                        {notif.message}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginTop: '8px',
                          fontSize: '11.5px',
                          color: 'var(--ink-faint)',
                        }}
                      >
                        <span>{formatRelativeTime(notif.created_at)}</span>
                        {notif.link && (
                          <span
                            style={{
                              color: 'var(--navy)',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            View details <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {!notif.read && (
                      <button
                        type="button"
                        onClick={(e) => handleToggleRead(notif.id, false, e)}
                        className="icon-sm"
                        title="Mark as read"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-green" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(notif.id, e)}
                      className="icon-sm danger"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid var(--line)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--green-bg)',
                color: 'var(--green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 style={{ fontSize: '16px', color: 'var(--navy)', marginBottom: '4px' }}>
              You're all caught up!
            </h4>
            <div style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>
              {hasAnyData
                ? `No notifications in the ${filter} category.`
                : 'No notifications at this time.'}
            </div>
            {hasAnyData && filter !== 'all' && (
              <button
                type="button"
                className="btn-outline"
                onClick={() => setFilter('all')}
                style={{ marginTop: '14px', fontSize: '12px', padding: '6px 12px' }}
              >
                View all notifications
              </button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        onConfirm={handleConfirmClearAll}
        title="Clear All Notifications"
        confirmText="Clear All"
        confirmVariant="danger"
        message="Are you sure you want to clear all notifications? This action cannot be undone."
      />
    </div>
  );
};
