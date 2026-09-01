import React, { useState, useEffect } from 'react';
import { Upload, Check, Loader2, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useToast } from '../../hooks/useToast';
import { brokerService } from '../../services/brokerService';

export const RecordBrokerPaymentModal = ({
  isOpen,
  onClose,
  broker = null,
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
    if (broker) {
      const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const rawPending = parseFloat(String(broker.pending || '').replace(/[^0-9.]/g, '')) || 0;
      setFormData({
        amount: rawPending > 0 ? String(rawPending) : '',
        payment_date: today,
        payment_mode: 'UPI / QR',
        payment_ref: '',
        payment_proof: '',
        payment_notes: '',
      });
      setPreviewUrl('');
      setError('');
    }
  }, [broker, isOpen]);

  if (!broker) return null;

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
      setError('Please enter a valid payout amount.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await brokerService.addPayment(broker.id, formData);
      showSuccess(
        'Commission Payment Recorded',
        `₹${num.toLocaleString('en-IN')} payout saved with proof for ${broker.name}.`
      );
      if (onPaymentSaved) {
        onPaymentSaved();
      }
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to record commission payout');
      showError('Payment Error', err?.message || 'Failed to record commission payout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pay Commission — ${broker.name}`}
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
              <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Broker</div>
              <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '13.5px' }}>
                {broker.name}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Pending Commission</div>
              <div
                style={{
                  fontWeight: 700,
                  color: broker.pending && broker.pending !== '₹0' ? 'var(--red)' : 'var(--green)',
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: '13px',
                }}
              >
                {broker.pending || '₹0'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="f-group">
              <label>Payout Amount (₹) *</label>
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
                  placeholder="e.g. 5000"
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
                placeholder="e.g. UTR/2026/09/881"
                style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px' }}
              />
            </div>
          </div>

          {/* Screenshot Upload Box */}
          <div className="f-group" style={{ marginTop: '10px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Payout Receipt / Transfer Screenshot Proof</span>
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
                  alt="Commission Screenshot Preview"
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
                    Payout Screenshot
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                    Ready to attach to commission ledger
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
                  Click to upload payout transfer screenshot
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
              placeholder="e.g. Commission payout for August dispatch orders"
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
                <span>Record Payout</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
