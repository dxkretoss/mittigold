import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const [email, setEmail] = useState('admin@farmflowfoods.in');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // Simulate API request
    await new Promise((resolve) => setTimeout(resolve, 600));
    setLoading(false);
    setIsSubmitted(true);
    showSuccess('Reset Link Sent', `Password reset instructions sent to ${email}`);
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
          {!isSubmitted ? (
            <>
              <h1>Reset password</h1>
              <div className="sub">
                Enter your registered email and we'll send you instructions to reset your password.
              </div>
              <div className="login-hint">
                This is a prototype — enter any email to simulate the password reset flow.
              </div>

              <form onSubmit={handleSubmit}>
                <div className="f-group">
                  <label>Registered Email</label>
                  <input
                    type="text"
                    required
                    placeholder="admin@farmflowfoods.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary login-submit mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Sending link…
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" /> Send Reset Link
                    </>
                  )}
                </button>
              </form>

              <div className="login-foot-link">
                <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:underline">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-brandGreen-bg flex items-center justify-center mx-auto mb-4 text-brandGreen">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="text-xl">Check your inbox</h1>
              <div className="sub text-sm mt-2 mb-6">
                We've sent a password reset link to <b className="text-ink">{email}</b>.
              </div>

              <button
                type="button"
                className="btn-primary login-submit mb-4"
                onClick={() => navigate('/login')}
              >
                Return to Sign In
              </button>

              <div className="text-xs text-ink-soft">
                Didn't receive the email?{' '}
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="text-blue font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  Click to resend
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
