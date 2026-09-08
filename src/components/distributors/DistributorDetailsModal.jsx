import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  MapPin,
  FileText,
  Package,
  CreditCard,
  Plus,
  CheckCircle,
  Clock,
  Truck,
  Eye,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { GrainGauge } from '../common/GrainGauge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { initials } from '../../utils/helpers';
import { distributorService } from '../../services/distributorService';
import { orderService } from '../../services/orderService';
import { invoiceService } from '../../services/invoiceService';
import { RecordPaymentModal } from './RecordPaymentModal';
import { useToast } from '../../hooks/useToast';
import { ORDER_STATUS_LABELS } from '../../utils/constants';
import { computeOrderValue } from '../../utils/orderPriceHelper';

export const DistributorDetailsModal = ({
  isOpen,
  onClose,
  distributorId,
  onEditDistributor,
  onDistributorUpdated,
}) => {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'payments' | 'info'
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'delivered' | 'pending'
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [deletePaymentDialog, setDeletePaymentDialog] = useState({
    isOpen: false,
    payment: null,
  });

  const loadDetails = async () => {
    if (!distributorId) return;
    try {
      setLoading(true);
      const [allDistributors, allOrders, allInvoices] = await Promise.all([
        distributorService.getAll(),
        orderService.getAll('all'),
        invoiceService.getAll(),
      ]);

      const cleanId = String(distributorId || '').trim();
      const decodedName = decodeURIComponent(cleanId).toLowerCase();

      const distributor = (allDistributors || []).find(
        (d) =>
          d.id === distributorId ||
          String(d.id) === cleanId ||
          (d.name && d.name.trim().toLowerCase() === decodedName)
      );

      if (!distributor) {
        showError('Distributor Not Found', 'Could not locate distributor record.');
        return;
      }

      const distName = (distributor.name || '').trim().toLowerCase();
      const distId = String(distributor.id || '').toLowerCase();

      // Find all matching orders
      const distOrders = (allOrders || []).filter((o) => {
        const orderDist = (o.dist || o.distributor || o.distributor_name || '').trim().toLowerCase();
        const orderDistId = String(o.dist_id || o.distributor_id || '').toLowerCase();
        return (
          orderDist === distName ||
          (orderDistId && orderDistId === distId) ||
          (orderDist && distName && (orderDist.includes(distName) || distName.includes(orderDist)))
        );
      });

      // Find all matching invoices
      const distInvoices = (allInvoices || []).filter((inv) => {
        const invDist = (inv.dist || inv.distributor || '').trim().toLowerCase();
        return (
          invDist === distName ||
          (invDist && distName && (invDist.includes(distName) || distName.includes(invDist)))
        );
      });

      // Fetch payment ledger
      const distPayments = await distributorService.getPayments(distributor.id, distributor.name);

      setData({
        distributor,
        orders: distOrders,
        invoices: distInvoices,
        payments: distPayments,
      });
    } catch (err) {
      showError('Failed to load distributor details', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && distributorId) {
      loadDetails();
      setActiveTab('orders');
      setOrderFilter('all');
    }
  }, [isOpen, distributorId]);

  if (!isOpen) return null;

  const distributor = data?.distributor;
  const orders = data?.orders || [];
  const invoices = data?.invoices || [];
  const payments = data?.payments || [];

  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const pendingOrders = orders.filter((o) => o.status !== 'delivered');

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'delivered') return o.status === 'delivered';
    if (orderFilter === 'pending') return o.status !== 'delivered';
    return true;
  });

  // Calculate total invoiced & paid
  const totalBilledVal = invoices.reduce((sum, inv) => {
    const num = parseFloat(String(inv.amt || '').replace(/[^0-9.]/g, '')) || 0;
    return sum + num;
  }, 0);

  const totalPaidVal = payments.reduce((sum, p) => {
    const num = p.amountNum || parseFloat(String(p.amount || '').replace(/[^0-9.]/g, '')) || 0;
    return sum + num;
  }, 0);

  const rawOutstanding = parseFloat(String(distributor?.outstanding || '').replace(/[^0-9.]/g, '')) || 0;

  const handleDeletePaymentClick = (payment) => {
    setDeletePaymentDialog({ isOpen: true, payment });
  };

  const handleConfirmDeletePayment = async () => {
    if (!deletePaymentDialog.payment?.id) return;
    try {
      await distributorService.deletePayment(deletePaymentDialog.payment.id, distributor.id);
      showSuccess('Payment Removed', 'Payment record deleted from ledger.');
      setDeletePaymentDialog({ isOpen: false, payment: null });
      await loadDetails();
      if (onDistributorUpdated) onDistributorUpdated();
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
        {loading || !distributor ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink-soft)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <div>Loading complete distributor profile & ledger...</div>
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
                  {initials(distributor.name)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--navy)' }}>
                      {distributor.name}
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
                      {distributor.zone}
                    </span>
                    <Badge
                      status={rawOutstanding === 0 || distributor.pay === 'paid' ? 'paid' : 'unpaid'}
                      label={rawOutstanding === 0 || distributor.pay === 'paid' ? 'Paid ✓' : 'Payment Due'}
                    />
                    {distributor.reference_type && (
                      <span
                        style={{
                          padding: '2px 8px',
                          background: distributor.reference_type === 'broker' ? 'var(--amber-bg)' : distributor.reference_type === 'employee' ? 'var(--green-bg)' : '#F1EFEA',
                          border: '1px solid var(--line)',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: distributor.reference_type === 'broker' ? '#886214' : distributor.reference_type === 'employee' ? 'var(--green)' : 'var(--ink-soft)',
                        }}
                      >
                        {distributor.reference_type === 'company'
                          ? 'Ref: Company Own'
                          : `Ref: ${distributor.reference_type === 'broker' ? 'Broker' : 'Employee'} (${distributor.reference_name || 'N/A'})`}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '12px', color: 'var(--ink-soft)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin className="w-3.5 h-3.5 text-wheat" />
                      {distributor.city}, {distributor.area}
                    </span>
                    {distributor.phone && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Phone className="w-3.5 h-3.5 text-wheat" />
                        {distributor.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Header Actions */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentOpen(true)}
                  className="btn btn-primary"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    height: '32px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
                {onEditDistributor && (
                  <button
                    type="button"
                    onClick={() => onEditDistributor(distributor)}
                    className="btn btn-outline"
                    style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* KPI Summary Tiles */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              <div style={{ background: 'var(--slate-bg)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 600 }}>Total Orders</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)', fontFamily: 'IBM Plex Mono, monospace', marginTop: '2px' }}>
                  {orders.length} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ink-soft)' }}>orders</span>
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                  <b style={{ color: 'var(--green)' }}>{deliveredOrders.length} Done</b> · <b style={{ color: 'var(--amber)' }}>{pendingOrders.length} Pending</b>
                </div>
              </div>

              <div style={{ background: 'var(--slate-bg)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 600 }}>Total Invoiced</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'IBM Plex Mono, monospace', marginTop: '2px' }}>
                  {totalBilledVal > 0 ? `₹${totalBilledVal.toLocaleString('en-IN')}` : '₹0'}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                  {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'} issued
                </div>
              </div>

              <div style={{ background: 'var(--slate-bg)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: '11px', color: 'var(--ink-soft)', fontWeight: 600 }}>Total Payments</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--green)', fontFamily: 'IBM Plex Mono, monospace', marginTop: '2px' }}>
                  {totalPaidVal > 0 ? `₹${totalPaidVal.toLocaleString('en-IN')}` : (distributor.pay === 'paid' ? 'Settled' : '₹0')}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                  {payments.length} {payments.length === 1 ? 'receipt' : 'receipts'} recorded
                </div>
              </div>

              <div style={{ background: rawOutstanding > 0 ? 'var(--red-bg)' : 'var(--green-bg)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: '11px', color: rawOutstanding > 0 ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>Outstanding Due</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: rawOutstanding > 0 ? 'var(--red)' : 'var(--green)', fontFamily: 'IBM Plex Mono, monospace', marginTop: '2px' }}>
                  {distributor.outstanding || '₹0'}
                </div>
                <div style={{ fontSize: '10.5px', color: rawOutstanding > 0 ? 'var(--red)' : 'var(--green)', marginTop: '2px' }}>
                  {rawOutstanding > 0 ? 'Payment Required' : 'Account Settled'}
                </div>
              </div>
            </div>

            {/* Target Gauge Line */}
            <div style={{ background: '#FAF9F6', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '11.5px' }}>
                <span style={{ color: 'var(--ink-soft)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <TrendingUp className="w-3.5 h-3.5 text-wheat" />
                  Target Progress: {distributor.target || 80} Bags / Month
                </span>
                <span className="mono" style={{ fontWeight: 700, color: (distributor.target || 0) >= 100 ? 'var(--green)' : 'var(--navy)' }}>
                  {distributor.target || 0}% Achieved
                </span>
              </div>
              <GrainGauge percent={distributor.target || 0} color={(distributor.target || 0) >= 100 ? 'green' : ''} />
            </div>

            {/* Tabs Bar */}
            <div style={{ display: 'flex', borderBottom: '2px solid var(--line)', marginBottom: '16px', gap: '20px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                style={{
                  padding: '8px 4px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'orders' ? '2px solid var(--wheat)' : '2px solid transparent',
                  marginBottom: '-2px',
                  fontWeight: activeTab === 'orders' ? 700 : 500,
                  color: activeTab === 'orders' ? 'var(--navy)' : 'var(--ink-soft)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Package className="w-3.5 h-3.5 text-wheat" />
                <span>Orders Breakdown ({orders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                style={{
                  padding: '8px 4px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'payments' ? '2px solid var(--wheat)' : '2px solid transparent',
                  marginBottom: '-2px',
                  fontWeight: activeTab === 'payments' ? 700 : 500,
                  color: activeTab === 'payments' ? 'var(--navy)' : 'var(--ink-soft)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <CreditCard className="w-3.5 h-3.5 text-wheat" />
                <span>Payment Receipts & Ledger ({payments.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('info')}
                style={{
                  padding: '8px 4px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'info' ? '2px solid var(--wheat)' : '2px solid transparent',
                  marginBottom: '-2px',
                  fontWeight: activeTab === 'info' ? 700 : 500,
                  color: activeTab === 'info' ? 'var(--navy)' : 'var(--ink-soft)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Building2 className="w-3.5 h-3.5 text-wheat" />
                <span>Billing & Info</span>
              </button>
            </div>

            {/* TAB 1: ORDERS BREAKDOWN */}
            {activeTab === 'orders' && (
              <div>
                {/* Orders sub-filter */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setOrderFilter('all')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${orderFilter === 'all' ? 'var(--wheat)' : 'var(--line)'}`,
                        background: orderFilter === 'all' ? 'var(--amber-bg)' : '#fff',
                        fontSize: '11.5px',
                        fontWeight: orderFilter === 'all' ? 700 : 500,
                        color: 'var(--navy)',
                        cursor: 'pointer',
                      }}
                    >
                      All Orders ({orders.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderFilter('delivered')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${orderFilter === 'delivered' ? 'var(--green)' : 'var(--line)'}`,
                        background: orderFilter === 'delivered' ? 'var(--green-bg)' : '#fff',
                        fontSize: '11.5px',
                        fontWeight: orderFilter === 'delivered' ? 700 : 500,
                        color: 'var(--green)',
                        cursor: 'pointer',
                      }}
                    >
                      Delivered / Done ({deliveredOrders.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderFilter('pending')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${orderFilter === 'pending' ? 'var(--amber)' : 'var(--line)'}`,
                        background: orderFilter === 'pending' ? 'var(--amber-bg)' : '#fff',
                        fontSize: '11.5px',
                        fontWeight: orderFilter === 'pending' ? 700 : 500,
                        color: 'var(--amber)',
                        cursor: 'pointer',
                      }}
                    >
                      Pending / In Transit ({pendingOrders.length})
                    </button>
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--ink-soft)', border: '1px dashed var(--line)', borderRadius: '8px' }}>
                    <Package className="w-8 h-8 text-wheat opacity-60" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>No orders found for this filter</div>
                    <div style={{ fontSize: '11.5px', marginTop: '2px' }}>
                      Orders created for {distributor.name} will be tracked here.
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto" style={{ border: '1px solid var(--line)', borderRadius: '8px' }}>
                    <table style={{ margin: 0, fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#FAFAF8' }}>
                          <th style={{ padding: '8px 12px' }}>Order ID</th>
                          <th style={{ padding: '8px 12px' }}>Date / ETA</th>
                          <th style={{ padding: '8px 12px' }}>Products & Qty</th>
                          <th style={{ padding: '8px 12px' }}>Order Value</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((o) => {
                          const isDone = o.status === 'delivered';
                          return (
                            <tr key={o.id} style={{ borderBottom: '1px solid var(--line)' }}>
                              <td style={{ padding: '10px 12px', fontWeight: 600 }} className="mono">
                                {o.id}
                              </td>
                              <td style={{ padding: '10px 12px', color: 'var(--ink-soft)' }}>
                                <div style={{ fontWeight: 500, color: 'var(--navy)' }}>{o.date || 'Today'}</div>
                                {!isDone && o.eta && (
                                  <div style={{ fontSize: '10.5px', color: 'var(--ink-faint)', marginTop: '2px' }}>
                                    ETA: {o.eta}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 500, color: 'var(--navy)' }}>
                                    {Array.isArray(o.items) && o.items.length > 1
                                      ? `${o.items[0].qty} bags · ${o.items[0].name}${o.items[0].pack ? ` (${o.items[0].pack})` : ''}`
                                      : (typeof o.qty === 'string' && o.qty.includes(',') ? o.qty.split(',')[0].trim() : (o.qty || 'Standard order'))}
                                  </span>
                                  {((Array.isArray(o.items) && o.items.length > 1) || (typeof o.qty === 'string' && o.qty.split(',').length > 1)) && (
                                    <span
                                      style={{
                                        fontSize: '10.5px',
                                        fontWeight: 700,
                                        padding: '1px 5px',
                                        borderRadius: '999px',
                                        background: 'var(--amber-bg)',
                                        color: 'var(--amber)',
                                      }}
                                    >
                                      +{Array.isArray(o.items) ? o.items.length - 1 : o.qty.split(',').length - 1} more
                                    </span>
                                  )}
                                  {Boolean(o.original_qty && String(o.original_qty).trim() && String(o.original_qty).trim() !== String(o.qty).trim()) && (
                                    <span
                                      style={{
                                        fontSize: '9.5px',
                                        fontWeight: 700,
                                        background: 'var(--amber-bg)',
                                        color: 'var(--amber)',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        border: '1px solid rgba(185, 131, 46, 0.35)',
                                      }}
                                      title="Original requested quantity was adjusted"
                                    >
                                      Adjusted
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: '10px 12px', fontWeight: 700 }} className="mono">
                                {computeOrderValue(o, invoices)}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                <span className={`chip ${isDone ? 'delivered' : (o.status || 'pending')}`}>
                                  {isDone ? '✓ Delivered' : (ORDER_STATUS_LABELS[o.status] || o.status || 'Pending')}
                                </span>
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

            {/* TAB 2: PAYMENT HISTORY & RECEIPTS */}
            {activeTab === 'payments' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                    Payment receipts, bank references, and proof screenshots submitted by <strong>{distributor.name}</strong>.
                  </div>
                </div>

                {payments.length === 0 ? (
                  <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--ink-soft)', border: '1px dashed var(--line)', borderRadius: '8px' }}>
                    <CreditCard className="w-8 h-8 text-wheat opacity-60" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>No payment receipts submitted yet</div>
                    <div style={{ fontSize: '11.5px', marginTop: '4px', maxWidth: '360px', margin: '4px auto 0' }}>
                      Payment receipts and transaction proofs uploaded by {distributor.name} will appear here for verification.
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto" style={{ border: '1px solid var(--line)', borderRadius: '8px' }}>
                    <table style={{ margin: 0, fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#FAFAF8' }}>
                          <th style={{ padding: '8px 12px' }}>Date</th>
                          <th style={{ padding: '8px 12px' }}>Amount Paid</th>
                          <th style={{ padding: '8px 12px' }}>Payment Mode</th>
                          <th style={{ padding: '8px 12px' }}>UTR / Reference</th>
                          <th style={{ padding: '8px 12px' }}>Screenshot Proof</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--line)' }}>
                            <td style={{ padding: '10px 12px', color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                              <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{p.payment_date}</div>
                              {p.payment_notes && (
                                <div style={{ fontSize: '10.5px', color: 'var(--ink-faint)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {p.payment_notes}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--green)' }} className="mono">
                              {p.amount}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span
                                style={{
                                  padding: '2px 7px',
                                  background: 'var(--slate-bg)',
                                  border: '1px solid var(--line)',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                }}
                              >
                                {p.payment_mode || 'UPI / QR'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '11.5px', color: 'var(--ink)' }}>
                              {p.payment_ref || '—'}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              {p.payment_proof ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage(p.payment_proof)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(61, 122, 92, 0.4)',
                                    background: '#FFFFFF',
                                    color: 'var(--green)',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <img
                                    src={p.payment_proof}
                                    alt="Proof"
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '3px',
                                      objectFit: 'cover',
                                      border: '1px solid var(--line)',
                                    }}
                                  />
                                  <span>View Receipt</span>
                                  <ExternalLink className="w-3 h-3 opacity-70" />
                                </button>
                              ) : (
                                <span style={{ fontSize: '11px', color: 'var(--ink-faint)', fontStyle: 'italic' }}>
                                  No screenshot
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => handleDeletePaymentClick(p)}
                                className="icon-sm danger"
                                title="Delete payment entry"
                                style={{ padding: '4px' }}
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

            {/* TAB 3: BILLING & DISTRIBUTOR INFO */}
            {activeTab === 'info' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: '#FAFAF8', border: '1px solid var(--line)', borderRadius: '8px', padding: '14px' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '13.5px', color: 'var(--navy)' }}>
                    Registration & Tax Info
                  </h4>
                  <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>Distributor Legal Name</div>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{distributor.name}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>GSTIN Number</div>
                      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, color: 'var(--ink)' }}>
                        {distributor.gstin || 'Not Provided'}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>Contact Phone</div>
                      <div style={{ fontFamily: 'IBM Plex Mono, monospace', color: 'var(--ink)' }}>
                        {distributor.phone || 'Not Provided'}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>Acquired / Reference By</div>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
                        {distributor.reference_type === 'company' || !distributor.reference_type
                          ? 'Company Own (Direct)'
                          : `${distributor.reference_type === 'broker' ? 'Broker' : 'Sales Employee'}: ${distributor.reference_name || 'N/A'}`}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#FAFAF8', border: '1px solid var(--line)', borderRadius: '8px', padding: '14px' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '13.5px', color: 'var(--navy)' }}>
                    Territory & Billing Address
                  </h4>
                  <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>Territory Assigned</div>
                      <div style={{ fontWeight: 600, color: 'var(--navy)' }}>
                        {distributor.zone} › {distributor.city} › {distributor.area}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>Billing Address</div>
                      <div style={{ color: 'var(--ink)', lineHeight: '1.4' }}>
                        {distributor.billing || `${distributor.area}, ${distributor.city}, ${distributor.zone}`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Record Payment Sub-Modal */}
      {isRecordPaymentOpen && distributor && (
        <RecordPaymentModal
          isOpen={isRecordPaymentOpen}
          onClose={() => setIsRecordPaymentOpen(false)}
          distributor={distributor}
          onPaymentSaved={async () => {
            await loadDetails();
            if (onDistributorUpdated) onDistributorUpdated();
          }}
        />
      )}

      {/* Delete Payment Confirm Dialog Modal */}
      <ConfirmDialog
        isOpen={deletePaymentDialog.isOpen}
        onClose={() => setDeletePaymentDialog({ isOpen: false, payment: null })}
        onConfirm={handleConfirmDeletePayment}
        title="Delete Payment Record"
        confirmText="Delete Record"
        confirmVariant="danger"
        message={
          deletePaymentDialog.payment ? (
            <>
              Are you sure you want to delete the payment of{' '}
              <b style={{ color: 'var(--ink)' }}>{deletePaymentDialog.payment.amount}</b> recorded on{' '}
              <b style={{ color: 'var(--ink)' }}>{deletePaymentDialog.payment.payment_date}</b> for {distributor.name}? This will remove the receipt screenshot from the ledger.
            </>
          ) : (
            'Are you sure you want to remove this payment record?'
          )
        }
      />

      {/* Screenshot Enlarge Preview Lightbox */}
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
                Payment Receipt Proof
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
