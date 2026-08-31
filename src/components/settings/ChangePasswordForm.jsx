import React, { useState } from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const PasswordInput = ({ id, value, onChange, placeholder, required, minLength }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ paddingRight: '2.5rem' }}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          padding: '0',
          cursor: 'pointer',
          color: 'var(--ink-soft)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};

export const ChangePasswordForm = () => {
  const { showSuccess } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setError('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showSuccess('Password Updated', 'Your admin password has been changed.');
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h3>Change Password</h3>
          <div className="hint">Admin account security</div>
        </div>
      </div>
      <div className="panel-body">
        <form onSubmit={handleSubmit} id="passwordForm">
          <div className="f-group">
            <label>Current Password</label>
            <PasswordInput
              id="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="f-group">
            <label>New Password</label>
            <PasswordInput
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
            />
          </div>
          <div className="f-group">
            <label>Confirm New Password</label>
            <PasswordInput
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
            />
          </div>

          {error && (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--red)',
                margin: '-6px 0 14px',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button className="btn-primary" type="submit">
              <Check className="w-3.5 h-3.5" /> Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
