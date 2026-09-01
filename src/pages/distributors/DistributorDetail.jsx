import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Building2,
  Package,
  CreditCard,
  Plus,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  X,
  TrendingUp,
  Clock,
  CheckCircle,
  FileText,
  Edit2,
  ShoppingBag,
  Eye,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { GrainGauge } from '../../components/common/GrainGauge';
import { Skeleton } from '../../components/common/Skeleton';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { initials } from '../../utils/helpers';
import { distributorService } from '../../services/distributorService';
import { zoneService } from '../../services/zoneService';
import { orderService } from '../../services/orderService';
import { invoiceService } from '../../services/invoiceService';
import { RecordPaymentModal } from '../../components/distributors/RecordPaymentModal';
import { AddDistributorModal } from '../../components/distributors/AddDistributorModal';
import { OrderDetailsModal } from '../../components/orders/OrderDetailsModal';
import { useToast } from '../../hooks/useToast';
import { ORDER_STATUS_LABELS } from '../../utils/constants';
import { computeOrderValue } from '../../utils/orderPriceHelper';

export const DistributorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [zones, setZones] = useState([]);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'payments' | 'info'
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'delivered' | 'pending'
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
      const [allDistributors, allOrders, allInvoices, zList] = await Promise.all([
        distributorService.getAll(),
        orderService.getAll('all'),
        invoiceService.getAll(),
        zoneService.getAll(),
      ]);

      const cleanId = String(id || '').trim();
      const decodedName = decodeURIComponent(cleanId).toLowerCase();

      const distributor = (allDistributors || []).find(
        (d) =>
          d.id === id ||
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
      setZones(zList || []);
    } catch (err) {
      showError('Failed to load distributor', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();

    const handleEvent = () => {
      loadDetails();
    };

    window.addEventListener('mittigold-order-created', handleEvent);
    window.addEventListener('mittigold-order-updated', handleEvent);
    window.addEventListener('mittigold-order-deleted', handleEvent);
    window.addEventListener('mittigold-distributor-updated', handleEvent);
    window.addEventListener('mittigold-payment-created', handleEvent);
    window.addEventListener('mittigold-payment-deleted', handleEvent);

    return () => {
      window.removeEventListener('mittigold-order-created', handleEvent);
      window.removeEventListener('mittigold-order-updated', handleEvent);
      window.removeEventListener('mittigold-order-deleted', handleEvent);
      window.removeEventListener('mittigold-distributor-updated', handleEvent);
      window.removeEventListener('mittigold-payment-created', handleEvent);
      window.removeEventListener('mittigold-payment-deleted', handleEvent);
    };
  }, [id]);

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
    } catch (err) {
      showError('Delete Failed', err.message);
    }
  };

  const handleUpdateDistributor = async (updatedData, distId) => {
    try {
      await distributorService.update(distId, updatedData);
      showSuccess('Distributor Updated', 'Distributor profile saved.');
      await loadDetails();
    } catch (err) {
      showError('Update Failed', err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Skeleton variant="text" width="200px" height="24px" />
        <Skeleton variant="rect" width="100%" height="180px" />
        <Skeleton variant="table" rows={5} cols={5} />
      </div>
    );
  }

  if (!distributor) {
    return (
      <div className="panel" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--navy)' }}>Distributor Not Found</h3>
        <p style={{ color: 'var(--ink-soft)', marginTop: '8px', marginBottom: '16px' }}>
          The requested distributor record does not exist or may have been deleted.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/distributors')}>
          ← Back to Distributors
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Top Breadcrumb & Back Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <button
          type="button"
          onClick={() => navigate('/distributors')}
          style={{
            background: 'none',
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--ink-soft)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <ArrowLeft className="w-4 h-4 text-wheat" />
          <span>Back to Distributor Directory</span>
        </button>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsRecordPaymentOpen(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="panel" style={{ padding: '22px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            paddingBottom: '18px',
            borderBottom: '1px solid var(--line)',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '12px',
                background: 'var(--navy)',
                color: 'var(--wheat)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '20px',
                fontFamily: 'IBM Plex Mono, monospace',
                boxShadow: '0 4px 12px rgba(18, 32, 54, 0.15)',
              }}
            >
              {initials(distributor.name)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--navy)' }}>
                  {distributor.name}
                </h2>
                <span
                  style={{
                    padding: '3px 9px',
                    background: 'var(--slate-bg)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    fontSize: '11.5px',
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
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '13px', color: 'var(--ink-soft)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin className="w-4 h-4 text-wheat" />
                  {distributor.city}, {distributor.area}
                </span>
                {distributor.phone && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Phone className="w-4 h-4 text-wheat" />
                    {distributor.phone}
                  </span>
                )}
                {distributor.gstin && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px' }}>
                    <Building2 className="w-4 h-4 text-wheat" />
                    GST: {distributor.gstin}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4 Summary KPI Tiles */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '14px',
            marginBottom: '18px',
          }}
        >
          <div style={{ background: '#FAF9F6', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Orders
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy)', fontFamily: 'IBM Plex Mono, monospace', marginTop: '4px' }}>
              {orders.length} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-soft)' }}>orders</span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', marginTop: '4px' }}>
              <b style={{ color: 'var(--green)' }}>{deliveredOrders.length} Done</b> · <b style={{ color: 'var(--amber)' }}>{pendingOrders.length} In Progress</b>
            </div>
          </div>

          <div style={{ background: '#FAF9F6', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Invoiced
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'IBM Plex Mono, monospace', marginTop: '4px' }}>
              {totalBilledVal > 0 ? `₹${totalBilledVal.toLocaleString('en-IN')}` : '₹0'}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', marginTop: '4px' }}>
              {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'} generated
            </div>
          </div>

          <div style={{ background: '#FAF9F6', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Paid
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--green)', fontFamily: 'IBM Plex Mono, monospace', marginTop: '4px' }}>
              {totalPaidVal > 0 ? `₹${totalPaidVal.toLocaleString('en-IN')}` : (distributor.pay === 'paid' ? 'Settled' : '₹0')}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', marginTop: '4px' }}>
              {payments.length} {payments.length === 1 ? 'receipt' : 'receipts'} recorded
            </div>
          </div>

          <div style={{ background: rawOutstanding > 0 ? 'var(--red-bg)' : 'var(--green-bg)', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: '11.5px', color: rawOutstanding > 0 ? 'var(--red)' : 'var(--green)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Outstanding Balance
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: rawOutstanding > 0 ? 'var(--red)' : 'var(--green)', fontFamily: 'IBM Plex Mono, monospace', marginTop: '4px' }}>
              {distributor.outstanding || '₹0'}
            </div>
            <div style={{ fontSize: '11.5px', color: rawOutstanding > 0 ? 'var(--red)' : 'var(--green)', marginTop: '4px' }}>
              {rawOutstanding > 0 ? 'Payment pending' : 'All accounts settled'}
            </div>
          </div>
        </div>

        {/* Target Progress Bar */}
        <div style={{ background: '#FAF9F6', border: '1px solid var(--line)', borderRadius: '10px', padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px' }}>
            <span style={{ color: 'var(--navy)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp className="w-4 h-4 text-wheat" />
              Target Quota: {distributor.target || 80} Bags / Month
            </span>
            <span className="mono" style={{ fontWeight: 700, color: (distributor.target || 0) >= 100 ? 'var(--green)' : 'var(--navy)' }}>
              {distributor.target || 0}% Achieved
            </span>
          </div>
          <GrainGauge percent={distributor.target || 0} color={(distributor.target || 0) >= 100 ? 'green' : ''} />
        </div>
      </div>

      {/* Tabbed Section Panel */}
      <div className="panel" style={{ padding: '20px' }}>
        {/* Tabs Bar */}
        <div style={{ display: 'flex', borderBottom: '2px solid var(--line)', marginBottom: '20px', gap: '24px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '10px 4px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'orders' ? '2px solid var(--wheat)' : '2px solid transparent',
              marginBottom: '-2px',
              fontWeight: activeTab === 'orders' ? 700 : 500,
              color: activeTab === 'orders' ? 'var(--navy)' : 'var(--ink-soft)',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Package className="w-4 h-4 text-wheat" />
            <span>Orders Breakdown ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            style={{
              padding: '10px 4px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'payments' ? '2px solid var(--wheat)' : '2px solid transparent',
              marginBottom: '-2px',
              fontWeight: activeTab === 'payments' ? 700 : 500,
              color: activeTab === 'payments' ? 'var(--navy)' : 'var(--ink-soft)',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CreditCard className="w-4 h-4 text-wheat" />
            <span>Payment Receipts & Ledger ({payments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('info')}
            style={{
              padding: '10px 4px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'info' ? '2px solid var(--wheat)' : '2px solid transparent',
              marginBottom: '-2px',
              fontWeight: activeTab === 'info' ? 700 : 500,
              color: activeTab === 'info' ? 'var(--navy)' : 'var(--ink-soft)',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Building2 className="w-4 h-4 text-wheat" />
            <span>Territory & Billing Profile</span>
          </button>
        </div>

        {/* TAB 1: ORDERS BREAKDOWN */}
        {activeTab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setOrderFilter('all')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '7px',
                    border: `1px solid ${orderFilter === 'all' ? 'var(--wheat)' : 'var(--line)'}`,
                    background: orderFilter === 'all' ? 'var(--amber-bg)' : '#fff',
                    fontSize: '12px',
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
                    padding: '5px 12px',
                    borderRadius: '7px',
                    border: `1px solid ${orderFilter === 'delivered' ? 'var(--green)' : 'var(--line)'}`,
                    background: orderFilter === 'delivered' ? 'var(--green-bg)' : '#fff',
                    fontSize: '12px',
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
                    padding: '5px 12px',
                    borderRadius: '7px',
                    border: `1px solid ${orderFilter === 'pending' ? 'var(--amber)' : 'var(--line)'}`,
                    background: orderFilter === 'pending' ? 'var(--amber-bg)' : '#fff',
                    fontSize: '12px',
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
              <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--ink-soft)', border: '1px dashed var(--line)', borderRadius: '10px' }}>
                <Package className="w-10 h-10 text-wheat opacity-60" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600 }}>No orders found matching this filter</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Orders registered for {distributor.name} will appear here.
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto" style={{ border: '1px solid var(--line)', borderRadius: '8px' }}>
                <table>
                  <thead>
                    <tr style={{ background: '#FAFAF8' }}>
                      <th>Order ID</th>
                      <th>Date / ETA</th>
                      <th>Products & Bag Quantities</th>
                      <th>Order Value</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
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
                            <div style={{ fontWeight: 500, color: 'var(--navy)' }}>{o.date || 'Today'}</div>
                            {!isDone && o.eta && (
                              <div style={{ fontSize: '11px', color: 'var(--ink-faint)', marginTop: '2px' }}>
                                ETA: {o.eta}
                              </div>
                            )}
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
                                  title="Originally requested quantity was adjusted"
                                >
                                  Adjusted
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ fontWeight: 700 }} className="mono">
                            {computeOrderValue(o, invoices)}
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
                              title="View full order details & line items"
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

        {/* TAB 2: PAYMENT RECEIPTS & LEDGER */}
        {activeTab === 'payments' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                Ledger of all payment transactions and uploaded receipt screenshots for {distributor.name}.
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
                  gap: '4px',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Next Payment</span>
              </button>
            </div>

            {payments.length === 0 ? (
              <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--ink-soft)', border: '1px dashed var(--line)', borderRadius: '10px' }}>
                <CreditCard className="w-10 h-10 text-wheat opacity-60" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600 }}>No payments recorded yet</div>
                <div style={{ fontSize: '12px', marginTop: '4px', maxWidth: '380px', margin: '4px auto 14px' }}>
                  Upload each bank transfer slip, UPI receipt screenshot, or cheque photo to keep an audit trail.
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto" style={{ border: '1px solid var(--line)', borderRadius: '8px' }}>
                <table>
                  <thead>
                    <tr style={{ background: '#FAFAF8' }}>
                      <th>Payment Date</th>
                      <th>Amount</th>
                      <th>Payment Mode</th>
                      <th>Transaction / UTR #</th>
                      <th>Screenshot Proof</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td style={{ color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{p.payment_date}</div>
                          {p.payment_notes && (
                            <div style={{ fontSize: '11px', color: 'var(--ink-faint)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                              {p.payment_notes}
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--green)' }} className="mono">
                          {p.amount}
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '3px 8px',
                              background: 'var(--slate-bg)',
                              border: '1px solid var(--line)',
                              borderRadius: '5px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              color: 'var(--navy)',
                            }}
                          >
                            {p.payment_mode || 'UPI / QR'}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: 'var(--ink)' }}>
                          {p.payment_ref || '—'}
                        </td>
                        <td>
                          {p.payment_proof ? (
                            <button
                              type="button"
                              onClick={() => setPreviewImage(p.payment_proof)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: '1px solid rgba(61, 122, 92, 0.4)',
                                background: '#FFFFFF',
                                color: 'var(--green)',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <img
                                src={p.payment_proof}
                                alt="Proof"
                                style={{
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '4px',
                                  objectFit: 'cover',
                                  border: '1px solid var(--line)',
                                }}
                              />
                              <span>View Receipt</span>
                              <ExternalLink className="w-3 h-3 opacity-70" />
                            </button>
                          ) : (
                            <span style={{ fontSize: '11.5px', color: 'var(--ink-faint)', fontStyle: 'italic' }}>
                              No screenshot
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleDeletePaymentClick(p)}
                            className="icon-sm danger"
                            title="Delete payment entry"
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

        {/* TAB 3: TERRITORY & BILLING PROFILE */}
        {activeTab === 'info' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: '#FAFAF8', border: '1px solid var(--line)', borderRadius: '10px', padding: '18px' }}>
              <h4 style={{ margin: '0 0 14px', fontSize: '14px', color: 'var(--navy)' }}>
                Registration & Contact Info
              </h4>
              <div style={{ fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>Distributor Legal Name</div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>{distributor.name}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>GSTIN Number</div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
                    {distributor.gstin || 'Not Provided'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>Contact Phone</div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', color: 'var(--ink)', marginTop: '2px' }}>
                    {distributor.phone || 'Not Provided'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: '#FAFAF8', border: '1px solid var(--line)', borderRadius: '10px', padding: '18px' }}>
              <h4 style={{ margin: '0 0 14px', fontSize: '14px', color: 'var(--navy)' }}>
                Territory & Billing Address
              </h4>
              <div style={{ fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>Territory Assigned</div>
                  <div style={{ fontWeight: 600, color: 'var(--navy)', marginTop: '2px' }}>
                    {distributor.zone} › {distributor.city} › {distributor.area}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>Billing Address</div>
                  <div style={{ color: 'var(--ink)', lineHeight: '1.5', marginTop: '2px' }}>
                    {distributor.billing || `${distributor.area}, ${distributor.city}, ${distributor.zone}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {isRecordPaymentOpen && distributor && (
        <RecordPaymentModal
          isOpen={isRecordPaymentOpen}
          onClose={() => setIsRecordPaymentOpen(false)}
          distributor={distributor}
          onPaymentSaved={loadDetails}
        />
      )}

      {/* Edit Distributor Modal */}
      {isEditModalOpen && distributor && (
        <AddDistributorModal
          isOpen={isEditModalOpen}
          distributor={distributor}
          onClose={() => setIsEditModalOpen(false)}
          zones={zones}
          onUpdate={handleUpdateDistributor}
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

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={Boolean(selectedOrderForView)}
        order={selectedOrderForView}
        onClose={() => setSelectedOrderForView(null)}
      />
    </div>
  );
};
