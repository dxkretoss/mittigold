import React, { useState } from 'react';
import { Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';

const PasswordInput = ({ id, value, onChange, placeholder, required, minLength, disabled }) => {
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
        disabled={disabled}
        style={{ paddingRight: '2.5rem' }}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
        disabled={disabled}
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          padding: '0',
          cursor: disabled ? 'not-allowed' : 'pointer',
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
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password cannot be the same as your current password.');
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
        userEmail: user?.email,
        userId: user?.id,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      showSuccess('Password Updated', 'Your admin password has been changed successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--red)',
                margin: '-6px 0 14px',
                background: 'var(--red-bg)',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(178, 72, 58, 0.2)',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button className="btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" /> Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
