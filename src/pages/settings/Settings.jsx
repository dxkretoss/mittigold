import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogOut, FileText, KeyRound, ShieldCheck, Shield } from 'lucide-react';
import { InvoiceSettingsForm } from '../../components/settings/InvoiceSettingsForm';
import { ChangePasswordForm } from '../../components/settings/ChangePasswordForm';
import { settingsService } from '../../services/settingsService';
import { useAuth } from '../../hooks/useAuth';

const SETTINGS_TAB_STORAGE_KEY = 'mittigold_settings_active_tab';

const TABS = [
  { id: 'invoice', label: 'Invoice Settings', icon: FileText },
  { id: 'password', label: 'Change Password', icon: KeyRound },
  { id: 'security', label: 'Security', icon: ShieldCheck },
];

export const Settings = () => {
  const [settings, setSettings] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialTab = () => {
    const urlTab = searchParams.get('tab');
    if (urlTab && TABS.some(t => t.id === urlTab)) {
      return urlTab;
    }
    try {
      const savedTab = localStorage.getItem(SETTINGS_TAB_STORAGE_KEY);
      if (savedTab && TABS.some(t => t.id === savedTab)) {
        return savedTab;
      }
    } catch (_) {}
    return 'invoice';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  const loadSettings = async () => {
    const data = await settingsService.getSettings();
    setSettings(data);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Sync state if URL query param changes
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && TABS.some(t => t.id === urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
      try {
        localStorage.setItem(SETTINGS_TAB_STORAGE_KEY, urlTab);
      } catch (_) {}
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
    try {
      localStorage.setItem(SETTINGS_TAB_STORAGE_KEY, tabId);
    } catch (_) {}
  };

  const handleSaveInvoiceSettings = async (updatedSettings) => {
    const data = await settingsService.updateSettings(updatedSettings);
    setSettings(data);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="space-y-4">
      {/* Settings Navigation Tabs */}
      <div style={{ marginBottom: '16px' }}>
        <div className="tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`tab ${isActive ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Invoice Settings */}
      {activeTab === 'invoice' && (
        <div style={{ maxWidth: '820px' }}>
          <InvoiceSettingsForm
            initialSettings={settings}
            onSave={handleSaveInvoiceSettings}
          />
        </div>
      )}

      {/* Tab 2: Change Password */}
      {activeTab === 'password' && (
        <div style={{ maxWidth: '640px' }}>
          <ChangePasswordForm />
        </div>
      )}

      {/* Tab 3: Security & Session */}
      {activeTab === 'security' && (
        <div style={{ maxWidth: '640px' }}>
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3>Session &amp; Security</h3>
                <div className="hint">
                  Signed in as <b>{user?.name || 'Admin'}</b> ({user?.email || 'admin@mittigold.com'})
                </div>
              </div>
            </div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  background: 'var(--bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'var(--green-bg)',
                      color: 'var(--green)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                  >
                    {user?.initials || 'AK'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--navy)' }}>
                      {user?.name || 'Administrator'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                      {user?.email || 'admin@mittigold.com'} &bull; Role: <span style={{ textTransform: 'capitalize' }}>{user?.role || 'Admin'}</span>
                    </div>
                  </div>
                </div>
                <span className="badge badge-green">Active Session</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '6px',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--ink-soft)', maxWidth: '420px', lineHeight: '1.5' }}>
                  Clicking sign out will safely end your current admin session and redirect you to the login screen.
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-outline flex-shrink-0"
                  style={{ color: 'var(--red)', borderColor: 'rgba(178, 72, 58, 0.3)' }}
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

