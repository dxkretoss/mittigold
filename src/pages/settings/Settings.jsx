import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { InvoiceSettingsForm } from '../../components/settings/InvoiceSettingsForm';
import { ChangePasswordForm } from '../../components/settings/ChangePasswordForm';
import { settingsService } from '../../services/settingsService';
import { useAuth } from '../../hooks/useAuth';

export const Settings = () => {
  const [settings, setSettings] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const loadSettings = async () => {
    const data = await settingsService.getSettings();
    setSettings(data);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveInvoiceSettings = async (updatedSettings) => {
    const data = await settingsService.updateSettings(updatedSettings);
    setSettings(data);
  };

  const handleResetInvoiceSettings = async () => {
    const data = await settingsService.resetSettings();
    setSettings(data);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="grid2" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start', gap: '18px' }}>
      <InvoiceSettingsForm
        initialSettings={settings}
        onSave={handleSaveInvoiceSettings}
      />
      <div className="space-y-4">
        <ChangePasswordForm />

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Session &amp; Security</h3>
              <div className="hint">Signed in as <b>{user?.name || 'Admin'}</b> ({user?.email || 'admin@farmflowfoods.in'})</div>
            </div>
          </div>
          <div className="panel-body flex justify-between items-center">
            <div className="text-xs text-ink-soft">
              Clicking sign out will end your current session and return you to the login screen.
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
  );
};

