import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useToast } from '../../hooks/useToast';

export const AddDistributorModal = ({ isOpen, onClose, zones = [], onAdd }) => {
  const { showSuccess } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    zone: '',
    city: '',
    area: '',
    target: 0,
    phone: '',
    gstin: '',
    sameBilling: true,
    billing: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.zone || !formData.city || !formData.area) return;

    const billingText = formData.sameBilling
      ? `${formData.area}, ${formData.city}`
      : formData.billing.trim();

    const newDist = {
      name: formData.name.trim(),
      zone: formData.zone,
      city: formData.city.trim(),
      area: formData.area.trim(),
      target: parseInt(formData.target) || 0,
      phone: formData.phone.trim(),
      gstin: formData.gstin.trim(),
      billing: billingText,
      outstanding: '₹0',
      pay: 'paid',
    };

    onAdd(newDist);
    showSuccess('Distributor Added', `${newDist.name} is now active in ${newDist.zone}.`);
    onClose();

    // Reset form
    setFormData({
      name: '',
      zone: '',
      city: '',
      area: '',
      target: 0,
      phone: '',
      gstin: '',
      sameBilling: true,
      billing: '',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Distributor"
      footer={
        <>
          <button className="btn-outline" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            type="button"
            onClick={(e) => {
              const form = document.getElementById('addDistributorForm');
              if (form) form.requestSubmit();
            }}
          >
            <Check className="w-3.5 h-3.5" /> Add Distributor
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

        <div className="f-group">
          <label>Contact Number</label>
          <input
            type="tel"
            placeholder="+91 90000 00000"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className="f-group">
          <label>GSTIN (optional)</label>
          <input
            type="text"
            placeholder="e.g. 24ABCPT4567F1Z2"
            value={formData.gstin}
            onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
          />
        </div>

        <div className="f-group f-check" style={{ marginBottom: '8px' }}>
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
