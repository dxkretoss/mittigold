import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LogIn,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      showSuccess(
        'Welcome Back!',
        `Logged in as ${loggedUser.name} (Admin)`
      );
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || 'Invalid email or password. Please try again.';
      setErrorMessage(msg);
      showError('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      {/* Brand Side */}
      <div className="login-brand">
        <div className="login-brand-top">
          <div className="mark">M</div>
          <div className="name">
            MittiGold
            <span>Distribution Portal</span>
          </div>
        </div>

        <div className="login-brand-mid">
          <h2>Run FarmFlow's entire distribution operation from one screen.</h2>
          <p>
            Leads, distributors, brokers, orders, invoicing and zone performance — built for the team that keeps atta, maida, rava and sooji moving across Gujarat.
          </p>
          <div className="login-stats">
            <div>
              <span>46</span>
              <small>Distributors</small>
            </div>
            <div>
              <span>4</span>
              <small>Zones</small>
            </div>
            <div>
              <span>9</span>
              <small>Products</small>
            </div>
          </div>
        </div>

        <div className="login-brand-foot">
          © 2026 MittiGold Distribution · Built by Kretoss Technology
        </div>
      </div>

      {/* Form Side */}
      <div className="login-formside">
        <div className="login-card">
          <h1>Welcome back</h1>
          <div className="sub">Sign in to MittiGold Admin account</div>

          {/* Admin Notice */}
          {/* <div className="login-hint" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', marginBottom: '18px' }}>
            <ShieldCheck className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--wheat)' }} />
            <span style={{ fontSize: '11.5px' }}>
              <b>Admin Web Portal:</b> Enter your administrator credentials to access management modules.
            </span>
          </div> */}

          {/* Inline Error Alert */}
          {errorMessage && (
            <div style={{
              background: 'var(--red-bg)',
              border: '1px solid rgba(178, 72, 58, 0.25)',
              borderRadius: '8px',
              padding: '10px 12px',
              marginBottom: '18px',
              fontSize: '12px',
              color: 'var(--red)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} id="loginForm">
            <div className="f-group">
              <label>Admin Email</label>
              <input
                type="email"
                required
                placeholder="admin@mittigold.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage(null);
                }}
              />
            </div>

            <div className="f-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                    alignItems: 'center'
                  }}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>

            <div className="login-row-between">
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button
              type="submit"
              className="btn-primary login-submit"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing In…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In as Admin
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
