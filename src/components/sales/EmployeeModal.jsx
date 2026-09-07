import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { PhoneInput } from '../common/PhoneInput';

const ZONES = ['South Gujarat', 'North Gujarat', 'Central Gujarat', 'Saurashtra'];

export const EmployeeModal = ({
  isOpen,
  onClose,
  employee = null,
  onSave,
}) => {
  const isEditing = !!employee?.id;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    role: 'Field Sales Officer',
    zone: 'South Gujarat',
    city: '',
    phone: '',
    email: '',
    target_bags: 500000,
    achieved_bags: 0,
    status: 'active',
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        role: employee.role || 'Field Sales Officer',
        zone: employee.zone || 'South Gujarat',
        city: employee.city || '',
        phone: employee.phone || '',
        email: employee.email || '',
        target_bags: employee.target_bags ?? 500000,
        achieved_bags: employee.achieved_bags ?? 0,
        status: employee.status || 'active',
      });
    } else {
      setFormData({
        name: '',
        role: 'Field Sales Officer',
        zone: 'South Gujarat',
        city: '',
        phone: '',
        email: '',
        target_bags: 500000,
        achieved_bags: 0,
        status: 'active',
      });
    }
  }, [employee, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    setLoading(true);
    try {
      await onSave({
        ...formData,
        target_bags: parseInt(formData.target_bags, 10) || 1000,
        achieved_bags: parseInt(formData.achieved_bags, 10) || 0,
      }, employee?.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Sales Employee' : 'Add New Sales Representative'}
      maxWidth="560px"
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
              const form = document.getElementById('employeeForm');
              if (form) form.requestSubmit();
            }}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            {isEditing ? 'Save Changes' : 'Add Employee'}
          </button>
        </>
      }
    >
      <form id="employeeForm" onSubmit={handleSubmit}>
        <div className="f-group">
          <label>Full Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Ramesh Joshi"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={loading}
          />
        </div>

        {/* <div className="f-row">
          <div className="f-group">
            <label>Assigned Zone *</label>
            <select
              value={formData.zone}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
              disabled={loading}
            >
              {ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          <div className="f-group">
            <label>Base City / Headquarters *</label>
            <input
              type="text"
              required
              placeholder="e.g. Surat, Ahmedabad, Rajkot"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              disabled={loading}
            />
          </div>
        </div> */}

        <div className="f-row">
          <div className="f-group">
            <label>Contact Phone *</label>
            <PhoneInput
              value={formData.phone}
              onChange={(val) => setFormData({ ...formData, phone: val })}
              disabled={loading}
              placeholder="+91 98250 12345"
            />
          </div>

          <div className="f-group">
            <label>Official Email</label>
            <input
              type="email"
              placeholder="name@farmflowfoods.in"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading}
            />
          </div>
        </div>

        {isEditing ? (
          <div className="f-row">
            <div className="f-group">
              <label>Monthly Target (₹) *</label>
              <input
                type="number"
                min="1"
                required
                placeholder="e.g. 500000"
                value={formData.target_bags}
                onChange={(e) => setFormData({ ...formData, target_bags: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="f-group">
              <label>Achieved MTD (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 250000"
                value={formData.achieved_bags}
                onChange={(e) => setFormData({ ...formData, achieved_bags: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>
        ) : (
          <div className="f-group">
            <label>Monthly Target (₹) *</label>
            <input
              type="number"
              min="1"
              required
              placeholder="e.g. 500000"
              value={formData.target_bags}
              onChange={(e) => setFormData({ ...formData, target_bags: e.target.value })}
              disabled={loading}
            />
          </div>
        )}
      </form>
    </Modal>
  );
};
