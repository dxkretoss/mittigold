import React, { useState, useEffect } from 'react';
import {
  Phone,
  Package,
  CreditCard,
  Plus,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  X,
  TrendingUp,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { OrderDetailsModal } from '../orders/OrderDetailsModal';
import { RecordBrokerPaymentModal } from './RecordBrokerPaymentModal';
import { initials } from '../../utils/helpers';
import { brokerService } from '../../services/brokerService';
import { computeOrderValue } from '../../utils/orderPriceHelper';
import { ORDER_STATUS_LABELS } from '../../utils/constants';
import { useToast } from '../../hooks/useToast';

export const BrokerDetailsModal = ({
  isOpen,
  onClose,
  brokerId = null,
  onUpdated,
}) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'payments' | 'info'
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedOrderForView, setSelectedOrderForView] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [deletePaymentDialog, setDeletePaymentDialog] = useState({
    isOpen: false,
    payment: null,
  });

  const loadDetails = async () => {
    if (!brokerId) return;
    try {
      setLoading(true);
      const res = await brokerService.getDetails(brokerId);
      setData(res);
    } catch (err) {
      showError('Error Loading Broker', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && brokerId) {
      loadDetails();
      setActiveTab('orders');
    }
  }, [isOpen, brokerId]);

  if (!isOpen) return null;

  const broker = data?.broker;
  const orders = data?.orders || [];
  const payments = data?.payments || [];
  const summary = data?.summary || {};

  const handleConfirmDeletePayment = async () => {
    if (!deletePaymentDialog.payment?.id || !broker?.id) return;
    try {
      await brokerService.deletePayment(deletePaymentDialog.payment.id, broker.id);
      showSuccess('Payment Removed', 'Commission payout record was removed from ledger.');
      setDeletePaymentDialog({ isOpen: false, payment: null });
      await loadDetails();
      if (onUpdated) onUpdated();
    } catch (err) {
      showError('Delete Failed', err.message);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title=""
        maxWidth="840px"
      >
        {loading || !broker ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink-soft)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <div>Loading complete broker profile & commission ledger...</div>
          </div>
        ) : (
          <div>
            {/* Header Profile Section */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '14px',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--line)',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '10px',
                    background: 'var(--navy)',
                    color: 'var(--wheat)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '16px',
                    fontFamily: 'IBM Plex Mono, monospace',
                  }}
                >
                  {initials(broker.name)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--navy)' }}>
                      {broker.name}
                    </h3>
                    <span
                      style={{
                        padding: '2px 8px',
                        background: 'var(--slate-bg)',
                        border: '1px solid var(--line)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--ink-soft)',
                      }}
                    >
                      {broker.rate || 5}% Commission Rate
                    </span>
                    <span className="chip paid" style={{ fontSize: '11px' }}>
                      Paid {broker.paid || '₹0'}
                    </span>
                    {broker.pending && broker.pending !== '₹0' && (
                      <span className="chip unpaid" style={{ fontSize: '11px' }}>
                        Pending {broker.pending}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '12px', color: 'var(--ink-soft)' }}>
                    {broker.phone && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Phone className="w-3.5 h-3.5 text-wheat" />
                        {broker.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentOpen(true)}
                  className="btn btn-primary"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pay Commission</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <div style={{ background: '#FAF9F5', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Total Orders Sourced</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)', marginTop: '2px' }}>
                  {summary.totalOrders || orders.length || broker.orders || 0}
                </div>
              </div>

              <div style={{ background: '#FAF9F5', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Commission Earned</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)', fontFamily: 'IBM Plex Mono, monospace', marginTop: '2px' }}>
                  {broker.commission || '₹0'}
                </div>
              </div>

              <div style={{ background: '#FAF9F5', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Commission Paid</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--green)', fontFamily: 'IBM Plex Mono, monospace', marginTop: '2px' }}>
                  {broker.paid || '₹0'}
                </div>
              </div>

              <div style={{ background: '#FAF9F5', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Pending Payout</div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: broker.pending && broker.pending !== '₹0' ? 'var(--red)' : 'var(--green)',
                    fontFamily: 'IBM Plex Mono, monospace',
                    marginTop: '2px',
                  }}
                >
                  {broker.pending || '₹0'}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid var(--line)',
                marginBottom: '16px',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                style={{
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: activeTab === 'orders' ? 700 : 500,
                  color: activeTab === 'orders' ? 'var(--wheat)' : 'var(--ink-soft)',
                  borderBottom: activeTab === 'orders' ? '2px solid var(--wheat)' : '2px solid transparent',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Package className="w-4 h-4" />
                <span>Orders Sourced ({orders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                style={{
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: activeTab === 'payments' ? 700 : 500,
                  color: activeTab === 'payments' ? 'var(--wheat)' : 'var(--ink-soft)',
                  borderBottom: activeTab === 'payments' ? '2px solid var(--wheat)' : '2px solid transparent',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CreditCard className="w-4 h-4" />
                <span>Commission Receipts & Ledger ({payments.length})</span>
              </button>
            </div>

            {/* TAB 1: SOURCED ORDERS BREAKDOWN */}
            {activeTab === 'orders' && (
              <div>
                {orders.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--ink-soft)', background: '#FAF9F5', borderRadius: '8px', border: '1px dashed var(--line)' }}>
                    <Package className="w-8 h-8 text-ink-faint mx-auto mb-2" />
                    <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '13px' }}>No orders found</div>
                    <div style={{ fontSize: '12px', marginTop: '2px' }}>
                      Orders sourced through {broker.name} will appear here.
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto" style={{ border: '1px solid var(--line)', borderRadius: '8px' }}>
                    <table>
                      <thead>
                        <tr style={{ background: '#FAFAF8' }}>
                          <th>Order ID</th>
                          <th>Date / ETA</th>
                          <th>Distributor</th>
                          <th>Products & Bag Quantities</th>
                          <th>Order Value</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => {
                          const isDone = o.status === 'delivered';
                          const isAdjusted = Boolean(
                            o.original_qty &&
                            String(o.original_qty).trim() &&
                            String(o.original_qty).trim() !== String(o.qty).trim()
                          );

                          let summaryText = o.qty || 'Standard order';
                          let extraCount = 0;
                          if (Array.isArray(o.items) && o.items.length > 1) {
                            summaryText = `${o.items[0].qty} bags · ${o.items[0].name}${o.items[0].pack ? ` (${o.items[0].pack})` : ''}`;
                            extraCount = o.items.length - 1;
                          } else if (typeof o.qty === 'string' && o.qty.includes(',')) {
                            const parts = o.qty.split(',').map((s) => s.trim()).filter(Boolean);
                            if (parts.length > 1) {
                              summaryText = parts[0];
                              extraCount = parts.length - 1;
                            }
                          }

                          return (
                            <tr key={o.id}>
                              <td
                                style={{ fontWeight: 600, cursor: 'pointer' }}
                                className="mono"
                                onClick={() => setSelectedOrderForView(o)}
                                title="Click to view full order details"
                              >
                                {o.id}
                              </td>
                              <td style={{ color: 'var(--ink-soft)' }}>
                                <div style={{ fontWeight: 500, color: 'var(--navy)' }}>{o.date || o.eta || 'Today'}</div>
                              </td>
                              <td style={{ fontWeight: 600, color: 'var(--navy)' }}>
                                {o.dist}
                              </td>
                              <td>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 500, color: 'var(--navy)' }}>{summaryText}</span>
                                  {extraCount > 0 && (
                                    <span
                                      style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '2px 6px',
                                        borderRadius: '999px',
                                        background: 'var(--amber-bg)',
                                        color: 'var(--amber)',
                                      }}
                                    >
                                      +{extraCount} more
                                    </span>
                                  )}
                                  {isAdjusted && (
                                    <span
                                      style={{
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        background: 'var(--amber-bg)',
                                        color: 'var(--amber)',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        border: '1px solid rgba(185, 131, 46, 0.35)',
                                      }}
                                    >
                                      Adjusted
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ fontWeight: 700 }} className="mono">
                                {computeOrderValue(o)}
                              </td>
                              <td>
                                <span className={`chip ${isDone ? 'delivered' : (o.status || 'pending')}`}>
                                  {isDone ? '✓ Delivered' : (ORDER_STATUS_LABELS[o.status] || o.status || 'Pending')}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  onClick={() => setSelectedOrderForView(o)}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '11.5px',
                                    height: '28px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    borderRadius: '6px',
                                    color: 'var(--navy)',
                                  }}
                                  title="View full order details"
                                >
                                  <Eye className="w-3.5 h-3.5 text-wheat" />
                                  <span>View</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: COMMISSION RECEIPTS & PAYMENT LEDGER */}
            {activeTab === 'payments' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                    Ledger of all commission payments transferred to {broker.name} with proof receipts.
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRecordPaymentOpen(true)}
                    className="btn btn-primary"
                    style={{
                      padding: '5px 12px',
                      fontSize: '12px',
                      height: '30px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Record Commission Payment</span>
                  </button>
                </div>

                {payments.length === 0 ? (
                  <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--ink-soft)', background: '#FAF9F5', borderRadius: '8px', border: '1px dashed var(--line)' }}>
                    <CreditCard className="w-8 h-8 text-ink-faint mx-auto mb-2" />
                    <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '13px' }}>No commission payments recorded yet</div>
                    <div style={{ fontSize: '12px', marginTop: '2px', color: 'var(--ink-soft)' }}>
                      Click <b>"+ Record Commission Payment"</b> to upload UPI / Bank transfer receipts.
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto" style={{ border: '1px solid var(--line)', borderRadius: '8px' }}>
                    <table>
                      <thead>
                        <tr style={{ background: '#FAFAF8' }}>
                          <th>Date</th>
                          <th>Amount Paid</th>
                          <th>Payment Mode</th>
                          <th>Reference / UTR</th>
                          <th>Receipt Proof</th>
                          <th>Notes</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{p.payment_date}</td>
                            <td className="mono" style={{ fontWeight: 700, color: 'var(--green)' }}>
                              {p.amount}
                            </td>
                            <td>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  background: 'var(--slate-bg)',
                                  fontSize: '11.5px',
                                  fontWeight: 500,
                                }}
                              >
                                {p.payment_mode || 'UPI / QR'}
                              </span>
                            </td>
                            <td className="mono" style={{ fontSize: '11.5px', color: 'var(--ink-soft)' }}>
                              {p.payment_ref || '—'}
                            </td>
                            <td>
                              {p.payment_proof ? (
                                <div
                                  onClick={() => setPreviewImage(p.payment_proof)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    background: 'var(--amber-bg)',
                                    border: '1px solid rgba(185, 131, 46, 0.3)',
                                  }}
                                  title="Click to view full payment screenshot"
                                >
                                  <img
                                    src={p.payment_proof}
                                    alt="Receipt thumbnail"
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      objectFit: 'cover',
                                      borderRadius: '4px',
                                    }}
                                  />
                                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--amber)' }}>
                                    View Proof
                                  </span>
                                </div>
                              ) : (
                                <span style={{ fontSize: '11.5px', color: 'var(--ink-faint)' }}>No proof</span>
                              )}
                            </td>
                            <td style={{ fontSize: '12px', color: 'var(--ink-soft)', maxWidth: '200px' }}>
                              {p.payment_notes || '—'}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="icon-sm danger"
                                onClick={() => setDeletePaymentDialog({ isOpen: true, payment: p })}
                                title="Delete payment record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Record Commission Payout Modal */}
      <RecordBrokerPaymentModal
        isOpen={isRecordPaymentOpen}
        broker={broker}
        onClose={() => setIsRecordPaymentOpen(false)}
        onPaymentSaved={async () => {
          await loadDetails();
          if (onUpdated) onUpdated();
        }}
      />

      {/* Order Details Modal for Sourced Orders */}
      <OrderDetailsModal
        isOpen={Boolean(selectedOrderForView)}
        order={selectedOrderForView}
        onClose={() => setSelectedOrderForView(null)}
      />

      {/* Delete Payment Confirm Dialog */}
      <ConfirmDialog
        isOpen={deletePaymentDialog.isOpen}
        onClose={() => setDeletePaymentDialog({ isOpen: false, payment: null })}
        onConfirm={handleConfirmDeletePayment}
        title="Delete Commission Payment Record"
        confirmText="Delete Record"
        confirmVariant="danger"
        message={
          deletePaymentDialog.payment ? (
            <>
              Are you sure you want to remove the payment of{' '}
              <b style={{ color: 'var(--green)' }}>{deletePaymentDialog.payment.amount}</b> ({deletePaymentDialog.payment.payment_date})?
            </>
          ) : (
            ''
          )
        }
      />

      {/* High-res Image Zoom Lightbox */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(13, 24, 38, 0.85)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '16px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '14px' }}>
                Commission Payout Receipt Proof
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--ink-soft)',
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={previewImage}
              alt="Full Receipt"
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: '8px',
                border: '1px solid var(--line)',
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};
