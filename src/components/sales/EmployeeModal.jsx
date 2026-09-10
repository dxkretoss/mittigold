import React, { useState, useEffect } from 'react';
import { Check, Loader2, Key, Eye, EyeOff, RefreshCw, Copy, CheckCheck, Smartphone } from 'lucide-react';
import { Modal } from '../common/Modal';
import { PhoneInput } from '../common/PhoneInput';
import { generateEmployeeCode, generateEmployeePassword } from '../../utils/helpers';
import { employeeService } from '../../services/employeeService';
import { useToast } from '../../hooks/useToast';

export const EmployeeModal = ({
  isOpen,
  onClose,
  employee = null,
  onSave,
}) => {
  const isEditing = !!employee?.id;
  const { showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    role: 'Field Sales Officer',
    zone: 'South Gujarat',
    city: '',
    phone: '',
    email: '',
    employee_code: '',
    password: '',
    target_bags: 500000,
    achieved_bags: 0,
    status: 'active',
  });

  useEffect(() => {
    if (isOpen) {
      if (employee) {
        setFormData({
          name: employee.name || '',
          role: employee.role || 'Field Sales Officer',
          zone: employee.zone || 'South Gujarat',
          city: employee.city || '',
          phone: employee.phone || '',
          email: employee.email || '',
          employee_code: employee.email || employee.employee_code || '',
          password: employee.password || generateEmployeePassword(),
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
          employee_code: '',
          password: generateEmployeePassword(),
          target_bags: 500000,
          achieved_bags: 0,
          status: 'active',
        });
      }
      setShowPassword(false);
      setCopiedField(null);
    }
  }, [employee, isOpen]);

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRegeneratePassword = () => {
    const newPass = generateEmployeePassword();
    setFormData((prev) => ({ ...prev, password: newPass }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showError('Required Field', 'Please enter employee full name.');
      return;
    }

    const cleanPhone = (formData.phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      showError('Required Field', 'Please enter a valid contact phone number with at least 10 digits.');
      return;
    }

    const cleanEmail = (formData.email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      showError('Required Field', 'Please enter a valid official email address (e.g. name@farmflowfoods.in).');
      return;
    }

    if (!formData.password || !formData.password.trim()) {
      showError('Required Field', 'Please provide or generate a mobile app password.');
      return;
    }

    const targetVal = parseInt(formData.target_bags, 10);
    if (isNaN(targetVal) || targetVal <= 0) {
      showError('Required Field', 'Please enter a valid monthly sales target (₹).');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...formData,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: cleanEmail,
        employee_code: cleanEmail,
        password: formData.password.trim(),
        target_bags: targetVal,
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
      title={isEditing ? 'Edit Sales Employee' : 'Register New Sales Employee'}
      maxWidth="580px"
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
            {isEditing ? 'Save Changes' : 'Register Employee'}
          </button>
        </>
      }
    >
      <form id="employeeForm" onSubmit={handleSubmit}>
        {/* Full Name */}
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

        {/* Contact Phone & Email */}
        <div className="f-row">
          <div className="f-group">
            <label>Contact Phone *</label>
            <PhoneInput
              value={formData.phone}
              onChange={(val) => setFormData({ ...formData, phone: val })}
              disabled={loading}
              placeholder="+91 98250 12345"
              required
            />
          </div>

          <div className="f-group">
            <label>Official Email *</label>
            <input
              type="email"
              required
              placeholder="name@farmflowfoods.in"
              value={formData.email}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  email: val,
                  employee_code: val,
                }));
              }}
              disabled={loading}
            />
          </div>
        </div>

        {/* Mobile App Login Credentials Box */}
        <div
          style={{
            marginTop: '14px',
            marginBottom: '14px',
            background: 'linear-gradient(135deg, rgba(200, 155, 60, 0.08) 0%, rgba(28, 48, 80, 0.05) 100%)',
            border: '1px solid rgba(200, 155, 60, 0.35)',
            borderRadius: '10px',
            padding: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: 'var(--navy)' }}>
              <Smartphone className="w-4 h-4 text-wheat" />
              <span>Mobile App Login Credentials</span>
            </div>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: '4px',
                background: 'var(--amber-bg)',
                color: 'var(--amber)',
                border: '1px solid rgba(185, 131, 46, 0.3)',
              }}
            >
              Auto-Generated Password
            </span>
          </div>

          <div className="f-row" style={{ marginBottom: 0 }}>
            {/* Login Email */}
            <div className="f-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Login Email (Username) *</span>
                {copiedField === 'email' && (
                  <span style={{ color: 'var(--green)', fontSize: '10.5px', fontWeight: 600 }}>Copied!</span>
                )}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="email"
                  readOnly
                  value={formData.email || ''}
                  placeholder="Enter official email above"
                  style={{
                    fontFamily: 'IBM Plex Mono, monospace',
                    fontWeight: 600,
                    fontSize: '12px',
                    paddingRight: '36px',
                    background: '#FAF9F6',
                    color: formData.email ? 'var(--navy)' : 'var(--ink-faint)',
                  }}
                />
                <button
                  type="button"
                  disabled={!formData.email}
                  onClick={() => handleCopy(formData.email, 'email')}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    background: 'none',
                    border: 'none',
                    cursor: formData.email ? 'pointer' : 'default',
                    color: copiedField === 'email' ? 'var(--green)' : 'var(--ink-soft)',
                    padding: '4px',
                    opacity: formData.email ? 1 : 0.4,
                  }}
                  title="Copy Login Email"
                >
                  {copiedField === 'email' ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Auto-generated Password */}
            <div className="f-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Mobile App Password *</span>
                {copiedField === 'password' && (
                  <span style={{ color: 'var(--green)', fontSize: '10.5px', fontWeight: 600 }}>Copied!</span>
                )}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={loading}
                  style={{
                    fontFamily: 'IBM Plex Mono, monospace',
                    fontWeight: 600,
                    paddingRight: '64px',
                    background: '#FFFFFF',
                  }}
                />
                <div style={{ position: 'absolute', right: '6px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--ink-soft)',
                      padding: '4px',
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleRegeneratePassword}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--wheat)',
                      padding: '4px',
                    }}
                    title="Generate new password"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(formData.password, 'password')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: copiedField === 'password' ? 'var(--green)' : 'var(--ink-soft)',
                      padding: '4px',
                    }}
                    title="Copy Password"
                  >
                    {copiedField === 'password' ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>💡 The sales employee will enter their official email and this generated password to log in to the mobile app.</span>
          </div>
        </div>

        {/* Monthly Target & Achievement */}
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

