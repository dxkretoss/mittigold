import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, Plus, Menu } from 'lucide-react';
import { PAGE_TITLES } from '../../utils/constants';
import { useToast } from '../../hooks/useToast';

export const Topbar = ({ onOpenMobileMenu, onOpenNewOrder }) => {
  const location = useLocation();
  const { showSuccess } = useToast();

  const currentMeta = PAGE_TITLES[location.pathname] || {
    title: 'Distribution Portal',
    sub: 'FarmFlow Operations'
  };

  const handleNotificationClick = () => {
    showSuccess('Notifications', 'You are caught up. 3 orders are due for dispatch today.');
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
        <div className="search hidden md:flex">
          <Search className="w-4 h-4 opacity-50 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search distributor, order…"
            className="bg-transparent border-none outline-none text-ink text-xs w-full"
          />
        </div>

        <button
          type="button"
          className="iconbtn"
          onClick={handleNotificationClick}
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="w-4 h-4 text-ink-soft" />
          <span className="dot" />
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
