import React, { useState, useEffect, useRef } from 'react';
import { Check, Upload, Image as ImageIcon, Trash2, Eye, ExternalLink, Calendar, CreditCard, FileText, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';

export const PaymentProofModal = ({
  isOpen,
  distributor,
  onClose,
  onConfirmPayment,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proofImage, setProofImage] = useState(null);
  const [fileName, setFileName] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI / QR');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (distributor && isOpen) {
      setProofImage(distributor.payment_proof || null);
      setFileName(distributor.payment_proof ? 'payment_receipt.png' : '');
      setPaymentDate(distributor.payment_date || todayStr);
      setPaymentRef(distributor.payment_ref || '');
      setPaymentMode(distributor.payment_mode || 'UPI / QR');
      setPaymentNotes(distributor.payment_notes || '');
      setIsPreviewOpen(false);
    } else {
      setProofImage(null);
      setFileName('');
      setPaymentDate(todayStr);
      setPaymentRef('');
      setPaymentNotes('');
    }
  }, [distributor, isOpen]);

  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG, WebP).');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setProofImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveImage = () => {
    setProofImage(null);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!distributor) return;

    setIsSubmitting(true);
    try {
      await onConfirmPayment(distributor.id, {
        payment_proof: proofImage,
        payment_date: paymentDate || todayStr,
        payment_ref: paymentRef.trim(),
        payment_mode: paymentMode,
        payment_notes: paymentNotes.trim(),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!distributor) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={distributor.pay === 'paid' && distributor.payment_proof ? 'Payment Record & Proof' : 'Record Payment Confirmation'}
      footer={
        <>
          <button className="btn-outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            className="btn-primary"
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              const form = document.getElementById('paymentProofForm');
              if (form) form.requestSubmit();
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" /> Confirm & Mark as Paid
              </>
            )}
          </button>
        </>
      }
    >
      <form id="paymentProofForm" onSubmit={handleSubmit}>
        {/* Distributor Summary Header */}
        <div
          style={{
            background: 'var(--slate-bg)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--navy)' }}>
              {distributor.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ink-soft)', marginTop: '2px' }}>
              {distributor.city}, {distributor.zone}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Outstanding Balance
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, fontSize: '15px', color: 'var(--red)' }}>
              {distributor.outstanding || '₹0'}
            </div>
          </div>
        </div>

        {/* Screenshot Upload Dropzone */}
        <div className="f-group">
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Payment Proof Screenshot / Receipt</span>
            <span style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 400 }}>
              (PNG, JPG, WebP)
            </span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />

          {!proofImage ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: isDragging ? '2px dashed var(--wheat)' : '2px dashed var(--line)',
                borderRadius: '10px',
                padding: '24px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragging ? 'var(--amber-bg)' : '#FAF9F6',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'var(--wheat-light)',
                  color: 'var(--navy)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                }}
              >
                <Upload className="w-5 h-5" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>
                Click to upload or drag & drop payment screenshot
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-faint)', marginTop: '4px' }}>
                Bank transfer receipt, UPI screenshot, or cheque copy
              </div>
            </div>
          ) : (
            <div
              style={{
                border: '1px solid var(--line)',
                borderRadius: '10px',
                padding: '12px',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                <img
                  src={proofImage}
                  alt="Payment Proof Preview"
                  onClick={() => setIsPreviewOpen(true)}
                  style={{
                    width: '54px',
                    height: '54px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  title="Click to zoom preview"
                />
                <div style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: 'var(--navy)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {fileName || 'Payment Screenshot Attached'}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '3px' }}>
                    <button
                      type="button"
                      onClick={() => setIsPreviewOpen(true)}
                      style={{
                        fontSize: '11px',
                        color: 'var(--blue)',
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Eye className="w-3 h-3" /> View Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        fontSize: '11px',
                        color: 'var(--wheat)',
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                      }}
                    >
                      Replace
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="icon-sm danger"
                onClick={handleRemoveImage}
                title="Remove image"
                style={{ flexShrink: 0 }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Lightbox Preview */}
        {isPreviewOpen && proofImage && (
          <div
            onClick={() => setIsPreviewOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(18, 32, 54, 0.85)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              cursor: 'zoom-out',
            }}
          >
            <div
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '90vh',
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '8px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={proofImage}
                alt="Full Payment Proof"
                style={{
                  maxWidth: '85vw',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  display: 'block',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 6px 4px',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                  {distributor.name} — Payment Screenshot
                </span>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setIsPreviewOpen(false)}
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Date & Mode */}
        <div className="f-row">
          <div className="f-group">
            <label>Payment Date *</label>
            <input
              type="date"
              required
              max={todayStr}
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="f-group">
            <label>Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="UPI / QR">UPI / QR (GPay / PhonePe)</option>
              <option value="Bank Transfer">Bank Transfer (NEFT / RTGS)</option>
              <option value="Cheque">Cheque Deposit</option>
              <option value="Cash">Cash Receipt</option>
            </select>
          </div>
        </div>

        {/* Reference Number & Notes */}
        <div className="f-row">
          <div className="f-group">
            <label>UTR / Transaction Ref (optional)</label>
            <input
              type="text"
              placeholder="e.g. UPI-923849102839"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="f-group">
            <label>Remarks / Notes (optional)</label>
            <input
              type="text"
              placeholder="e.g. Cleared via HDFC A/C"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
