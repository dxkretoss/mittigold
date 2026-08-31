import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Plus, Menu } from 'lucide-react';
import { PAGE_TITLES } from '../../utils/constants';
import { notificationService } from '../../services/notificationService';

export const Topbar = ({ onOpenMobileMenu, onOpenNewOrder }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const currentMeta = PAGE_TITLES[location.pathname] || {
    title: 'Distribution Portal',
    sub: 'FarmFlow Operations'
  };

  const loadUnread = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (_) { }
  };

  useEffect(() => {
    loadUnread();

    const handleUpdate = () => {
      loadUnread();
    };

    window.addEventListener('mittigold-notifications-updated', handleUpdate);
    return () => {
      window.removeEventListener('mittigold-notifications-updated', handleUpdate);
    };
  }, []);

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  return (
    <header className="topbar">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden iconbtn"
          aria-label="Open menu"
        >
          <Menu className="w-4 h-4 text-ink-soft" />
        </button>

        <div>
          <h1 id="pageTitle">{currentMeta.title}</h1>
          <div className="sub" id="pageSub">{currentMeta.sub}</div>
        </div>
      </div>

      <div className="topbar-right">
        {/* <div className="search hidden md:flex">
          <Search className="w-4 h-4 opacity-50 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search distributor, order…"
            className="bg-transparent border-none outline-none text-ink text-xs w-full"
          />
        </div> */}

        <button
          type="button"
          className="iconbtn"
          onClick={handleNotificationClick}
          aria-label="Notifications"
          title={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
          style={{ position: 'relative' }}
        >
          <Bell className="w-4 h-4 text-ink-soft" />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--red)',
                border: '1.5px solid #FFFFFF',
              }}
            />
          )}
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={onOpenNewOrder}
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Order</span>
        </button>
      </div>
    </header>
  );
};
