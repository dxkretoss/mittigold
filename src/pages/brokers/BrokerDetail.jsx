import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
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
  Clock,
  Eye,
} from 'lucide-react';
import { Skeleton } from '../../components/common/Skeleton';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { OrderDetailsModal } from '../../components/orders/OrderDetailsModal';
import { RecordBrokerPaymentModal } from '../../components/brokers/RecordBrokerPaymentModal';
import { initials } from '../../utils/helpers';
import { brokerService } from '../../services/brokerService';
import { computeOrderValue } from '../../utils/orderPriceHelper';
import { ORDER_STATUS_LABELS } from '../../utils/constants';
import { useToast } from '../../hooks/useToast';

export const BrokerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'payments' | 'info'
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'delivered' | 'pending'
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedOrderForView, setSelectedOrderForView] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [deletePaymentDialog, setDeletePaymentDialog] = useState({
    isOpen: false,
    payment: null,
  });

  const loadDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await brokerService.getDetails(id);
      if (!res) {
        showError('Broker Not Found', 'Could not locate broker record.');
        return;
      }
      setData(res);
    } catch (err) {
      showError('Error Loading Broker', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="panel" style={{ padding: '24px' }}>
        <Skeleton variant="card" count={3} />
      </div>
    );
  }

  if (!data || !data.broker) {
    return (
      <div className="panel" style={{ padding: '40px', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--navy)' }}>Broker Not Found</h3>
        <p style={{ color: 'var(--ink-soft)', marginTop: '6px' }}>
          No broker matches ID or name "{id}".
        </p>
        <Link to="/brokers" className="btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Brokers
        </Link>
      </div>
    );
  }

  const broker = data.broker;
  const orders = data.orders || [];
  const payments = data.payments || [];
  const summary = data.summary || {};

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'delivered') return o.status === 'delivered';
    if (orderFilter === 'pending') return o.status !== 'delivered';
    return true;
  });

  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const pendingOrdersCount = orders.filter((o) => o.status !== 'delivered').length;

  const handleConfirmDeletePayment = async () => {
    if (!deletePaymentDialog.payment?.id || !broker?.id) return;
    try {
      await brokerService.deletePayment(deletePaymentDialog.payment.id, broker.id);
      showSuccess('Payment Removed', 'Commission payout record was removed from ledger.');
      setDeletePaymentDialog({ isOpen: false, payment: null });
      await loadDetails();
    } catch (err) {
      showError('Delete Failed', err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Card */}
      <div className="panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Link
            to="/brokers"
            className="btn btn-outline"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Brokers</span>
          </Link>
          <span style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>/</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>
            {broker.name}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                background: 'var(--navy)',
                color: 'var(--wheat)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '20px',
                fontFamily: 'IBM Plex Mono, monospace',
                boxShadow: '0 4px 12px rgba(18, 32, 54, 0.15)',
              }}
            >
              {initials(broker.name)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--navy)' }}>
                  {broker.name}
                </h2>
                <span
                  style={{
                    padding: '2px 9px',
                    background: 'var(--slate-bg)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: 'var(--ink-soft)',
                  }}
                >
                  {broker.rate || 5}% Commission Rate
                </span>
                <span className="chip paid" style={{ fontSize: '11.5px' }}>
                  Paid {broker.paid || '₹0'}
                </span>
                {broker.pending && broker.pending !== '₹0' && (
                  <span className="chip unpaid" style={{ fontSize: '11.5px' }}>
                    Pending {broker.pending}
                  </span>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginTop: '6px',
                  fontSize: '13px',
                  color: 'var(--ink-soft)',
                  flexWrap: 'wrap',
                }}
              >
                {broker.phone && (
                  <a
                    href={`tel:${broker.phone}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      color: 'var(--ink)',
                      textDecoration: 'none',
                    }}
                  >
                    <Phone className="w-4 h-4 text-wheat" />
                    <span>{broker.phone}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsRecordPaymentOpen(true)}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
              }}
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay Commission</span>
            </button>
          </div>
        </div>

        {/* 4 Performance Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid var(--line)',
          }}
        >
          <div style={{ background: '#FAF9F5', border: '1px solid var(--line)', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--ink-soft)', fontWeight: 500 }}>Total Orders Sourced</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy)', marginTop: '4px' }}>
              {summary.totalOrders || orders.length}
            </div>
          </div>

          <div style={{ background: '#FAF9F5', border: '1px solid var(--line)', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--ink-soft)', fontWeight: 500 }}>Total Commission Earned</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy)', fontFamily: 'IBM Plex Mono, monospace', marginTop: '4px' }}>
              {broker.commission || '₹0'}
            </div>
          </div>

          <div style={{ background: '#FAF9F5', border: '1px solid var(--line)', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--ink-soft)', fontWeight: 500 }}>Commission Paid (with Receipts)</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--green)', fontFamily: 'IBM Plex Mono, monospace', marginTop: '4px' }}>
              {broker.paid || '₹0'}
            </div>
          </div>

          <div style={{ background: '#FAF9F5', border: '1px solid var(--line)', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--ink-soft)', fontWeight: 500 }}>Pending Payout Balance</div>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: broker.pending && broker.pending !== '₹0' ? 'var(--red)' : 'var(--green)',
                fontFamily: 'IBM Plex Mono, monospace',
                marginTop: '4px',
              }}
            >
              {broker.pending || '₹0'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Panel */}
      <div className="panel" style={{ padding: '24px' }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            borderBottom: '1px solid var(--line)',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '10px 18px',
              fontSize: '13.5px',
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
              gap: '8px',
            }}
          >
            <Package className="w-4 h-4" />
            <span>Orders Sourced ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            style={{
              padding: '10px 18px',
              fontSize: '13.5px',
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
              gap: '8px',
            }}
          >
            <CreditCard className="w-4 h-4" />
            <span>Commission Receipts & Ledger ({payments.length})</span>
          </button>
        </div>

        {/* TAB 1: SOURCED ORDERS BREAKDOWN */}
        {activeTab === 'orders' && (
          <div>
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setOrderFilter('all')}
                style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: orderFilter === 'all' ? 700 : 500,
                  border: orderFilter === 'all' ? '1.5px solid var(--wheat)' : '1px solid var(--line)',
                  background: orderFilter === 'all' ? 'var(--amber-bg)' : '#FFFFFF',
                  color: orderFilter === 'all' ? 'var(--navy)' : 'var(--ink-soft)',
                  cursor: 'pointer',
                }}
              >
                All Orders ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setOrderFilter('delivered')}
                style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: orderFilter === 'delivered' ? 700 : 500,
                  border: orderFilter === 'delivered' ? '1.5px solid var(--green)' : '1px solid var(--line)',
                  background: orderFilter === 'delivered' ? 'var(--green-bg)' : '#FFFFFF',
                  color: orderFilter === 'delivered' ? 'var(--green)' : 'var(--ink-soft)',
                  cursor: 'pointer',
                }}
              >
                Delivered / Done ({deliveredCount})
              </button>
              <button
                type="button"
                onClick={() => setOrderFilter('pending')}
                style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: orderFilter === 'pending' ? 700 : 500,
                  border: orderFilter === 'pending' ? '1.5px solid var(--amber)' : '1px solid var(--line)',
                  background: orderFilter === 'pending' ? 'var(--amber-bg)' : '#FFFFFF',
                  color: orderFilter === 'pending' ? 'var(--amber)' : 'var(--ink-soft)',
                  cursor: 'pointer',
                }}
              >
                Pending / In Transit ({pendingOrdersCount})
              </button>
            </div>

            {filteredOrders.length === 0 ? (
              <div
                style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  background: '#FAF9F5',
                  borderRadius: '10px',
                  border: '1px dashed var(--line)',
                }}
              >
                <Package className="w-10 h-10 text-ink-faint mx-auto mb-2" />
                <h4 style={{ margin: 0, color: 'var(--navy)', fontSize: '15px' }}>No orders found</h4>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                  {orderFilter === 'all'
                    ? `No orders currently registered for ${broker.name}.`
                    : `No ${orderFilter} orders match this filter.`}
                </p>
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
                      <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => {
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
                          <td style={{ width: '100px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
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
                            </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>
                Complete ledger of commission transfers to {broker.name} with screenshot proof attachments.
              </div>
              <button
                type="button"
                onClick={() => setIsRecordPaymentOpen(true)}
                className="btn btn-primary"
                style={{
                  padding: '6px 14px',
                  fontSize: '12.5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Plus className="w-4 h-4" />
                <span>Upload Commission Payment</span>
              </button>
            </div>

            {payments.length === 0 ? (
              <div
                style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  background: '#FAF9F5',
                  borderRadius: '10px',
                  border: '1px dashed var(--line)',
                }}
              >
                <CreditCard className="w-10 h-10 text-ink-faint mx-auto mb-2" />
                <h4 style={{ margin: 0, color: 'var(--navy)', fontSize: '15px' }}>No commission payments recorded</h4>
                <p style={{ margin: '4px 0 16px', fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                  Upload UPI / Bank transfer payment receipts for {broker.name}.
                </p>
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
                      <th style={{ width: '90px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{p.payment_date}</td>
                        <td className="mono" style={{ fontWeight: 700, color: 'var(--green)', fontSize: '13.5px' }}>
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
                        <td style={{ width: '90px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="icon-sm danger"
                              onClick={() => setDeletePaymentDialog({ isOpen: true, payment: p })}
                              title="Delete payment record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* Record Commission Payment Modal */}
      <RecordBrokerPaymentModal
        isOpen={isRecordPaymentOpen}
        broker={broker}
        onClose={() => setIsRecordPaymentOpen(false)}
        onPaymentSaved={loadDetails}
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
              Are you sure you want to remove the payout of{' '}
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
    </div>
  );
};
