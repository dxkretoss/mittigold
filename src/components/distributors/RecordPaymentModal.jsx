import React, { useState, useEffect } from 'react';
import { Upload, Check, Loader2, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useToast } from '../../hooks/useToast';
import { distributorService } from '../../services/distributorService';

export const RecordPaymentModal = ({
  isOpen,
  onClose,
  distributor = null,
  onPaymentSaved,
}) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: '',
    payment_mode: 'UPI / QR',
    payment_ref: '',
    payment_proof: '',
    payment_notes: '',
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (distributor) {
      const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const rawOutstanding = parseFloat(String(distributor.outstanding || '').replace(/[^0-9.]/g, '')) || 0;
      setFormData({
        amount: rawOutstanding > 0 ? String(rawOutstanding) : '',
        payment_date: today,
        payment_mode: 'UPI / QR',
        payment_ref: '',
        payment_proof: '',
        payment_notes: '',
      });
      setPreviewUrl('');
      setError('');
    }
  }, [distributor, isOpen]);

  if (!distributor) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result;
      setPreviewUrl(base64Data);
      setFormData((prev) => ({ ...prev, payment_proof: base64Data }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setPreviewUrl('');
    setFormData((prev) => ({ ...prev, payment_proof: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = parseFloat(String(formData.amount).replace(/[^0-9.]/g, ''));
    if (!num || num <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await distributorService.addPayment(distributor.id, formData);
      showSuccess(
        'Payment Recorded',
        `₹${num.toLocaleString('en-IN')} payment saved with proof for ${distributor.name}.`
      );
      if (onPaymentSaved) {
        onPaymentSaved();
      }
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to record payment');
      showError('Payment Error', err?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment — ${distributor.name}`}
      maxWidth="500px"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'var(--slate-bg)',
              borderRadius: '8px',
              marginBottom: '14px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Distributor</div>
              <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '13.5px' }}>
                {distributor.name}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Outstanding Balance</div>
              <div style={{ fontWeight: 700, color: distributor.outstanding && distributor.outstanding !== '₹0' ? 'var(--red)' : 'var(--green)', fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px' }}>
                {distributor.outstanding || '₹0'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="f-group">
              <label>Amount Paid (₹) *</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontWeight: 600,
                    color: 'var(--ink-soft)',
                    fontFamily: 'IBM Plex Mono, monospace',
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.amount}
                  onChange={(e) => {
                    setFormData({ ...formData, amount: e.target.value });
                    if (error) setError('');
                  }}
                  placeholder="e.g. 25000"
                  style={{ paddingLeft: '28px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600 }}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="f-group">
              <label>Payment Date *</label>
              <input
                type="text"
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                placeholder="e.g. 01 Sep 2026"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
            <div className="f-group">
              <label>Payment Mode</label>
              <select
                value={formData.payment_mode}
                onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
              >
                <option value="UPI / QR">UPI / QR Code</option>
                <option value="NEFT / RTGS">NEFT / RTGS / IMPS</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div className="f-group">
              <label>Reference / UTR #</label>
              <input
                type="text"
                value={formData.payment_ref}
                onChange={(e) => setFormData({ ...formData, payment_ref: e.target.value })}
                placeholder="e.g. UPI/20260901/88421"
                style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px' }}
              />
            </div>
          </div>

          {/* Screenshot Upload Box */}
          <div className="f-group" style={{ marginTop: '10px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Payment Receipt / Screenshot Proof</span>
              {previewUrl && (
                <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600 }}>
                  ✓ Screenshot attached
                </span>
              )}
            </label>

            {previewUrl ? (
              <div
                style={{
                  position: 'relative',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '8px',
                  background: '#FAFAF8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <img
                  src={previewUrl}
                  alt="Payment Receipt Preview"
                  style={{
                    width: '64px',
                    height: '64px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--navy)' }}>
                    Payment Screenshot
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                    Ready to attach to payment ledger
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  style={{
                    padding: '6px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    background: '#FFFFFF',
                    color: 'var(--red)',
                    cursor: 'pointer',
                  }}
                  title="Remove Screenshot"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                  border: '2px dashed var(--line)',
                  borderRadius: '8px',
                  background: '#FCFBF9',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Upload className="w-5 h-5 text-wheat" style={{ marginBottom: '6px' }} />
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--navy)' }}>
                  Click to upload payment screenshot
                </span>
                <span style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                  PNG, JPG, WEBP up to 5MB (UPI receipt, bank transfer slip, cheque photo)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>

          <div className="f-group" style={{ marginTop: '10px' }}>
            <label>Notes / Remarks (Optional)</label>
            <input
              type="text"
              value={formData.payment_notes}
              onChange={(e) => setFormData({ ...formData, payment_notes: e.target.value })}
              placeholder="e.g. Advance payment for Chakki Fresh Atta order"
            />
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                background: 'var(--red-bg)',
                borderRadius: '6px',
                color: 'var(--red)',
                fontSize: '11.5px',
                marginTop: '12px',
              }}
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            paddingTop: '12px',
            borderTop: '1px solid var(--line)',
          }}
        >
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ minWidth: '140px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Payment</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
