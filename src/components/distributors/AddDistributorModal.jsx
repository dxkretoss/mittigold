import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { PhoneInput } from '../common/PhoneInput';
import { useToast } from '../../hooks/useToast';

export const AddDistributorModal = ({
  isOpen,
  onClose,
  zones = [],
  distributor = null,
  onAdd,
  onUpdate,
}) => {
  const isEditing = !!distributor?.id;
  const { showSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    zone: '',
    city: '',
    area: '',
    target: 80,
    phone: '',
    gstin: '',
    sameBilling: true,
    billing: '',
  });

  useEffect(() => {
    if (distributor) {
      setFormData({
        name: distributor.name || '',
        zone: distributor.zone || '',
        city: distributor.city || '',
        area: distributor.area || '',
        target: distributor.target !== undefined ? distributor.target : 80,
        phone: distributor.phone || '',
        gstin: distributor.gstin || '',
        sameBilling: !distributor.billing || distributor.billing === `${distributor.area}, ${distributor.city}`,
        billing: distributor.billing || '',
      });
    } else {
      setFormData({
        name: '',
        zone: zones[0]?.name || '',
        city: '',
        area: '',
        target: 80,
        phone: '',
        gstin: '',
        sameBilling: true,
        billing: '',
      });
    }
  }, [distributor, isOpen, zones]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.zone || !formData.city || !formData.area) return;

    setLoading(true);
    const billingText = formData.sameBilling
      ? `${formData.area.trim()}, ${formData.city.trim()}`
      : formData.billing.trim();

    const distPayload = {
      name: formData.name.trim(),
      zone: formData.zone,
      city: formData.city.trim(),
      area: formData.area.trim(),
      target: parseInt(formData.target) || 0,
      outstanding: isEditing && distributor?.outstanding ? distributor.outstanding : '₹0',
      pay: isEditing && distributor?.pay ? distributor.pay : 'paid',
      phone: formData.phone.trim(),
      gstin: formData.gstin.trim(),
      billing: billingText,
    };

    try {
      if (isEditing && onUpdate) {
        await onUpdate(distPayload, distributor.id);
        showSuccess('Distributor Updated', `${distPayload.name} updated successfully.`);
      } else if (onAdd) {
        await onAdd(distPayload);
        showSuccess('Distributor Added', `${distPayload.name} is now active in ${distPayload.zone}.`);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Distributor' : 'Add New Distributor'}
      footer={
        <>
          <button className="btn-outline" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn-primary"
            type="button"
            disabled={loading}
            onClick={() => {
              const form = document.getElementById('addDistributorForm');
              if (form) form.requestSubmit();
            }}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            {isEditing ? 'Save Changes' : 'Add Distributor'}
          </button>
        </>
      }
    >
      <form id="addDistributorForm" onSubmit={handleSubmit}>
        <div className="f-group">
          <label>Distributor / Business Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Shree Ganesh Traders"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="f-row">
          <div className="f-group">
            <label>Zone</label>
            <select
              required
              value={formData.zone}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
            >
              <option value="">Select zone</option>
              {zones.map((z) => (
                <option key={z.id || z.name} value={z.name}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
          <div className="f-group">
            <label>City</label>
            <input
              type="text"
              required
              placeholder="e.g. Surat"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
        </div>

        <div className="f-row">
          <div className="f-group">
            <label>Area</label>
            <input
              type="text"
              required
              placeholder="e.g. Adajan"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            />
          </div>
          <div className="f-group">
            <label>1st Year Target (%)</label>
            <input
              type="number"
              min="0"
              max="200"
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value })}
            />
          </div>
        </div>

        <div className="f-row">
          <div className="f-group">
            <label>Contact Number</label>
            <PhoneInput
              value={formData.phone}
              onChange={(val) => setFormData({ ...formData, phone: val })}
              disabled={loading}
            />
          </div>
          <div className="f-group">
            <label>GSTIN (optional)</label>
            <input
              type="text"
              placeholder="e.g. 24ABCPT4567F1Z2"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
              disabled={loading}
            />
          </div>
        </div>

        <div className="f-group f-check" style={{ marginBottom: '8px', marginTop: '4px' }}>
          <input
            type="checkbox"
            id="dSameBilling"
            checked={formData.sameBilling}
            onChange={(e) =>
              setFormData({ ...formData, sameBilling: e.target.checked })
            }
          />
          <label htmlFor="dSameBilling">Billing address same as Area / City</label>
        </div>

        {!formData.sameBilling && (
          <div className="f-group">
            <label>Billing Address</label>
            <textarea
              rows="2"
              placeholder="Full billing address for invoices"
              value={formData.billing}
              onChange={(e) =>
                setFormData({ ...formData, billing: e.target.value })
              }
            />
          </div>
        )}
      </form>
    </Modal>
  );
};
