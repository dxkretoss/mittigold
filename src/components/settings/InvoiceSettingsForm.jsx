import React, { useState, useEffect } from 'react';
import { Check, Edit2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

export const InvoiceSettingsForm = ({ initialSettings, onSave }) => {
  const { showSuccess } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    legal: '',
    gstin: '',
    address: '',
    email: '',
    phone: '',
    defaultGst: 5,
    invoicePrefix: 'MG-INV-',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      setFormData({
        name: initialSettings.name || '',
        legal: initialSettings.legal || '',
        gstin: initialSettings.gstin || '',
        address: initialSettings.address || '',
        email: initialSettings.email || '',
        phone: initialSettings.phone || '',
        defaultGst: initialSettings.defaultGst !== undefined ? initialSettings.defaultGst : 5,
        invoicePrefix: initialSettings.invoicePrefix || 'MG-INV-',
      });
    }
  }, [initialSettings]);

  const handleCancel = () => {
    if (initialSettings) {
      setFormData({
        name: initialSettings.name || '',
        legal: initialSettings.legal || '',
        gstin: initialSettings.gstin || '',
        address: initialSettings.address || '',
        email: initialSettings.email || '',
        phone: initialSettings.phone || '',
        defaultGst: initialSettings.defaultGst !== undefined ? initialSettings.defaultGst : 5,
        invoicePrefix: initialSettings.invoicePrefix || 'MG-INV-',
      });
    }
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(formData);
      }
      showSuccess(
        'Settings Saved',
        'Invoice details will now appear as "Bill From" on new invoices.'
      );
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3>Invoice Settings</h3>
          <div className="hint">Shown as "Bill From" on every invoice</div>
        </div>
        {!isEditing && (
          <button
            type="button"
            className="btn-outline"
            style={{ padding: '6px 12px', fontSize: '12px', gap: '5px' }}
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
        )}
      </div>
      <div className="panel-body">
        <form onSubmit={handleSubmit} id="settingsForm">
          <div className="f-group">
            <label>Company Display Name</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="f-group">
            <label>Legal Entity Name</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData.legal}
              onChange={(e) => setFormData({ ...formData, legal: e.target.value })}
            />
          </div>
          <div className="f-group">
            <label>GSTIN</label>
            <input
              type="text"
              disabled={!isEditing}
              placeholder="e.g. 24AAAFF1234A1Z5"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
            />
          </div>
          <div className="f-group">
            <label>Registered Address</label>
            <textarea
              rows="2"
              disabled={!isEditing}
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>
          <div className="f-row">
            <div className="f-group">
              <label>Support Email</label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="f-group">
              <label>Support Phone</label>
              <input
                type="tel"
                disabled={!isEditing}
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
          </div>
          <div className="f-row">
            <div className="f-group">
              <label>Default GST Rate</label>
              <select
                disabled={!isEditing}
                value={formData.defaultGst}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultGst: parseInt(e.target.value),
                  })
                }
              >
                <option value="0">0% — Exempt</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
              </select>
            </div>
            <div className="f-group">
              <label>Invoice Number Prefix</label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.invoicePrefix}
                onChange={(e) =>
                  setFormData({ ...formData, invoicePrefix: e.target.value })
                }
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            {isEditing ? (
              <>
                <button
                  type="button"
                  className="btn-outline"
                  disabled={isSaving}
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button className="btn-primary" type="submit" disabled={isSaving}>
                  <Check className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save Invoice Settings'}
                </button>
              </>
            ) : (
              <button
                className="btn-primary"
                type="button"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Invoice Settings
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};


