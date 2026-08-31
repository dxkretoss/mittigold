import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Users,
  Building2,
  UserCheck,
  Package,
  FileText,
  Layers,
  Settings,
  LogOut
} from 'lucide-react';
import { NAV_ITEMS } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import { orderService } from '../../services/orderService';

const ICON_MAP = {
  LayoutDashboard,
  MapPin,
  Users,
  Building2,
  UserCheck,
  Package,
  FileText,
  Layers,
  Settings
};

export const Sidebar = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orderBadgeCount, setOrderBadgeCount] = useState(7);

  useEffect(() => {
    orderService.getPendingCount().then(count => setOrderBadgeCount(count));
  }, []);

  const handleUserClick = () => {
    if (onNavigate) onNavigate();
    navigate('/settings');
  };

  const handleLogout = async (e) => {
    e.stopPropagation();
    if (onNavigate) onNavigate();
    await logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="brand">
        <div className="mark">M</div>
        <div className="name">
          MittiGold
          <span>Distribution Portal</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="navlist">
        {NAV_ITEMS.map((group) => (
          <div key={group.group}>
            <div className="navgroup-label">{group.group}</div>
            {group.items.map((item) => {
              const IconComponent = ICON_MAP[item.icon];
              const badgeValue = item.key === 'orders' ? orderBadgeCount : item.badge;

              return (
                <NavLink
                  key={item.key}
                  to={item.path}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `navitem ${isActive ? 'active' : ''}`
                  }
                >
                  {IconComponent && <IconComponent className="ic" />}
                  <span>{item.label}</span>
                  {badgeValue !== undefined && (
                    <span className="badge">{badgeValue}</span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer User Chip & Logout */}
      <div className="sidebar-foot flex items-center justify-between gap-1">
        <div
          className="userchip flex-1 min-w-0"
          style={{ cursor: 'pointer' }}
          onClick={handleUserClick}
          title="Account Settings"
        >
          <div className="av flex-shrink-0">{user?.initials || 'AK'}</div>
          <div className="who min-w-0">
            <b className="truncate block">{user?.name || 'Ankur K.'}</b>
            <span className="truncate block">{user?.role || 'Admin'} · {user?.company || 'FarmFlow Foods'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-7 h-7 rounded-md flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};

