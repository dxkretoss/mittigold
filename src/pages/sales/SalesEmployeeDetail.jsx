import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Building2,
  Package,
  TrendingUp,
  Clock,
  Edit2,
  Trash2,
  Users,
  Target,
  Award,
  Eye,
  ExternalLink,
  ShieldCheck,
  Briefcase,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { GrainGauge } from '../../components/common/GrainGauge';
import { Skeleton } from '../../components/common/Skeleton';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmployeeModal } from '../../components/sales/EmployeeModal';
import { OrderDetailsModal } from '../../components/orders/OrderDetailsModal';
import { employeeService } from '../../services/employeeService';
import { computeOrderValue } from '../../utils/orderPriceHelper';
import { ORDER_STATUS_LABELS } from '../../utils/constants';
import { useToast } from '../../hooks/useToast';
import { initials } from '../../utils/helpers';

export const SalesEmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('distributors'); // 'distributors' | 'leads' | 'orders' | 'profile'
  const [orderFilter, setOrderFilter] = useState('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrderForView, setSelectedOrderForView] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
  });

  const loadDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await employeeService.getDetails(id);
      if (!res || !res.employee) {
        showError('Employee Not Found', 'Could not locate employee record.');
        return;
      }
      setData(res);
    } catch (err) {
      showError('Error Loading Details', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();

    const handleUpdate = () => {
      loadDetails();
    };

    window.addEventListener('mittigold-employee-updated', handleUpdate);
    window.addEventListener('mittigold-order-created', handleUpdate);
    window.addEventListener('mittigold-order-updated', handleUpdate);
    window.addEventListener('mittigold-lead-updated', handleUpdate);
    window.addEventListener('mittigold-lead-created', handleUpdate);
    return () => {
      window.removeEventListener('mittigold-employee-updated', handleUpdate);
      window.removeEventListener('mittigold-order-created', handleUpdate);
      window.removeEventListener('mittigold-order-updated', handleUpdate);
      window.removeEventListener('mittigold-lead-updated', handleUpdate);
      window.removeEventListener('mittigold-lead-created', handleUpdate);
    };
  }, [id]);

  const handleSaveEmployee = async (empData, empId) => {
    try {
      await employeeService.update(empId, empData);
      showSuccess('Employee Updated', `${empData.name} profile has been updated.`);
      setIsEditModalOpen(false);
      await loadDetails();
    } catch (err) {
      showError('Update Failed', err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!data?.employee?.id) return;
    try {
      await employeeService.delete(data.employee.id);
      showSuccess('Employee Removed', `${data.employee.name} was removed from the sales team.`);
      setDeleteDialog({ isOpen: false });
      navigate('/sales-team');
    } catch (err) {
      showError('Delete Failed', err.message);
    }
  };

  if (loading) {
    return (
      <div className="panel" style={{ padding: '24px' }}>
        <Skeleton variant="card" count={3} />
      </div>
    );
  }

  if (!data || !data.employee) {
    return (
      <div className="panel" style={{ padding: '40px', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--navy)' }}>Sales Employee Not Found</h3>
        <p style={{ color: 'var(--ink-soft)', marginTop: '6px' }}>
          No sales employee matches ID or name "{id}".
        </p>
        <Link to="/sales-team" className="btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Sales Team
        </Link>
      </div>
    );
  }

  const employee = data.employee;
  const distributors = data.distributors || [];
  const leads = data.leads || [];
  const orders = data.orders || [];

  const target = Number(employee.target_bags) || 0;
  const achieved = Number(employee.achieved_bags) || 0;
  const pct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'delivered') return o.status === 'delivered';
    if (orderFilter === 'pending') return o.status !== 'delivered';
    return true;
  });

  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const pendingOrdersCount = orders.filter((o) => o.status !== 'delivered').length;

  return (
    <div className="page-animate" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <button
          type="button"
          onClick={() => navigate('/sales-team')}
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
          <span>Back to Sales Team</span>
        </button>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setDeleteDialog({ isOpen: true })}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--red)' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="panel" style={{ padding: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--line)',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '14px',
                background: 'var(--navy)',
                color: 'var(--wheat)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '22px',
                fontFamily: 'IBM Plex Mono, monospace',
                boxShadow: '0 4px 12px rgba(18, 32, 54, 0.15)',
              }}
            >
              {initials(employee.name)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--navy)' }}>
                  {employee.name}
                </h2>
                {employee.role && (
                  <span
                    style={{
                      padding: '3px 10px',
                      background: 'var(--slate-bg)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: 'var(--navy)',
                    }}
                  >
                    {employee.role}
                  </span>
                )}
                <span
                  style={{
                    padding: '3px 10px',
                    background: employee.status === 'active' ? 'var(--green-bg)' : 'var(--amber-bg)',
                    border: `1px solid ${employee.status === 'active' ? 'var(--green)' : 'var(--amber)'}`,
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: employee.status === 'active' ? 'var(--green)' : 'var(--amber)',
                    textTransform: 'capitalize',
                  }}
                >
                  {employee.status || 'Active'}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '18px',
                  marginTop: '8px',
                  fontSize: '13px',
                  color: 'var(--ink-soft)',
                  flexWrap: 'wrap',
                }}
              >
                {employee.zone && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin className="w-3.5 h-3.5 text-wheat" />
                    <strong style={{ color: 'var(--ink)' }}>{employee.zone}</strong>
                    {employee.city && ` · ${employee.city}`}
                  </span>
                )}
                {employee.phone && (
                  <a
                    href={`tel:${employee.phone}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      color: 'var(--ink)',
                      textDecoration: 'none',
                    }}
                  >
                    <Phone className="w-3.5 h-3.5 text-wheat" />
                    <span>{employee.phone}</span>
                  </a>
                )}
                {employee.email && (
                  <a
                    href={`mailto:${employee.email}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      color: 'var(--ink)',
                      textDecoration: 'none',
                    }}
                  >
                    <Mail className="w-3.5 h-3.5 text-wheat" />
                    <span>{employee.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4 Performance Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div style={{ background: '#FAFAF8', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Monthly Sales Target
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy)', fontFamily: 'IBM Plex Mono, monospace', marginTop: '4px' }}>
              ₹{target.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', marginTop: '4px' }}>
              Assigned Monthly Quota
            </div>
          </div>

          <div style={{ background: '#FAFAF8', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Achieved Performance
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: pct >= 80 ? 'var(--green)' : 'var(--amber)', fontFamily: 'IBM Plex Mono, monospace', marginTop: '4px' }}>
              ₹{achieved.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11.5px', color: pct >= 80 ? 'var(--green)' : 'var(--amber)', marginTop: '4px', fontWeight: 600 }}>
              {pct}% Target Achieved
            </div>
          </div>

          <div style={{ background: '#FAFAF8', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Assigned Distributors
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy)', fontFamily: 'IBM Plex Mono, monospace', marginTop: '4px' }}>
              {distributors.length}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', marginTop: '4px' }}>
              Network Distributors
            </div>
          </div>

          <div style={{ background: '#FAFAF8', padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Managed Leads
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy)', fontFamily: 'IBM Plex Mono, monospace', marginTop: '4px' }}>
              {leads.length}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', marginTop: '4px' }}>
              Active in Pipeline
            </div>
          </div>
        </div>

        {/* Target Progress Bar */}
        <div style={{ background: '#FAF9F6', border: '1px solid var(--line)', borderRadius: '10px', padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '12px' }}>
            <span style={{ color: 'var(--navy)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp className="w-4 h-4 text-wheat" />
              Target Progress: ₹{achieved.toLocaleString('en-IN')} of ₹{target.toLocaleString('en-IN')}
            </span>
            <span className="mono" style={{ fontWeight: 700, color: pct >= 80 ? 'var(--green)' : 'var(--navy)' }}>
              {pct}% Achieved
            </span>
          </div>
          <GrainGauge percent={pct} color={pct >= 80 ? 'green' : ''} />
        </div>
      </div>

      {/* Tabbed Section Panel */}
      <div className="panel" style={{ padding: '20px' }}>
        {/* Tabs Bar */}
        <div style={{ display: 'flex', borderBottom: '2px solid var(--line)', marginBottom: '20px', gap: '24px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('distributors')}
            style={{
              padding: '10px 4px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'distributors' ? '2px solid var(--wheat)' : '2px solid transparent',
              marginBottom: '-2px',
              fontWeight: activeTab === 'distributors' ? 700 : 500,
              color: activeTab === 'distributors' ? 'var(--navy)' : 'var(--ink-soft)',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Building2 className="w-4 h-4 text-wheat" />
            <span>Assigned Distributors ({distributors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leads')}
            style={{
              padding: '10px 4px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'leads' ? '2px solid var(--wheat)' : '2px solid transparent',
              marginBottom: '-2px',
              fontWeight: activeTab === 'leads' ? 700 : 500,
              color: activeTab === 'leads' ? 'var(--navy)' : 'var(--ink-soft)',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Target className="w-4 h-4 text-wheat" />
            <span>Managed Leads ({leads.length})</span>
          </button>

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
            <span>Orders & Sales ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '10px 4px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'profile' ? '2px solid var(--wheat)' : '2px solid transparent',
              marginBottom: '-2px',
              fontWeight: activeTab === 'profile' ? 700 : 500,
              color: activeTab === 'profile' ? 'var(--navy)' : 'var(--ink-soft)',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Briefcase className="w-4 h-4 text-wheat" />
            <span>Territory & Role Info</span>
          </button>
        </div>

        {/* TAB 1: ASSIGNED DISTRIBUTORS */}
        {activeTab === 'distributors' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                Distributors operating in <strong>{employee.zone || 'assigned territory'}</strong> managed by {employee.name}.
              </div>
            </div>

            {distributors.length === 0 ? (
              <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--ink-soft)', border: '1px dashed var(--line)', borderRadius: '10px' }}>
                <Building2 className="w-10 h-10 text-wheat opacity-60" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600 }}>No distributors assigned yet</div>
                <div style={{ fontSize: '12px', marginTop: '4px', maxWidth: '400px', margin: '4px auto 0' }}>
                  Distributors mapped to {employee.name} or located in {employee.zone} will appear here.
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto" style={{ border: '1px solid var(--line)', borderRadius: '8px' }}>
                <table>
                  <thead>
                    <tr style={{ background: '#FAFAF8' }}>
                      <th>Distributor</th>
                      <th>Zone & Location</th>
                      <th>Target Quota</th>
                      <th>Outstanding</th>
                      <th>Payment Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distributors.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{d.name}</div>
                          {d.gstin && (
                            <div style={{ fontSize: '11px', color: 'var(--ink-soft)', fontFamily: 'IBM Plex Mono, monospace' }}>
                              {d.gstin}
                            </div>
                          )}
                        </td>
                        <td className="zoneword">
                          {d.zone} {d.city ? `· ${d.city}` : ''}
                        </td>
                        <td className="mono" style={{ fontWeight: 600 }}>
                          {d.target || 80} bags
                        </td>
                        <td className="mono" style={{ fontWeight: 700, color: d.outstanding && d.outstanding !== '₹0' ? 'var(--red)' : 'var(--green)' }}>
                          {d.outstanding || '₹0'}
                        </td>
                        <td>
                          <Badge
                            status={d.pay === 'paid' ? 'paid' : 'unpaid'}
                            label={d.pay === 'paid' ? 'Paid ✓' : 'Payment Due'}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link
                            to={`/distributors/${d.id}`}
                            className="btn btn-outline"
                            style={{
                              padding: '4px 10px',
                              fontSize: '11.5px',
                              height: '28px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              borderRadius: '6px',
                              color: 'var(--navy)',
                              textDecoration: 'none',
                            }}
                          >
                            <Eye className="w-3.5 h-3.5 text-wheat" />
                            <span>View</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANAGED LEADS */}
        {activeTab === 'leads' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                Prospects, kirana stores, and leads assigned to <strong>{employee.name}</strong>.
              </div>
            </div>

            {leads.length === 0 ? (
              <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--ink-soft)', border: '1px dashed var(--line)', borderRadius: '10px' }}>
                <Target className="w-10 h-10 text-wheat opacity-60" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600 }}>No leads assigned yet</div>
                <div style={{ fontSize: '12px', marginTop: '4px', maxWidth: '400px', margin: '4px auto 0' }}>
                  New leads registered with {employee.name} as lead owner will be tracked here.
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto" style={{ border: '1px solid var(--line)', borderRadius: '8px' }}>
                <table>
                  <thead>
                    <tr style={{ background: '#FAFAF8' }}>
                      <th>Lead / Store Name</th>
                      <th>Zone</th>
                      <th>Pipeline Stage</th>
                      <th>Contact Phone</th>
                      <th>Last Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l) => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{l.name}</td>
                        <td className="zoneword">{l.zone}</td>
                        <td>
                          <span
                            className={`chip ${
                              l.stage === 'convert'
                                ? 'approved'
                                : l.stage === 'close'
                                ? 'delivered'
                                : l.stage === 'followup'
                                ? 'pending'
                                : 'dispatched'
                            }`}
                            style={{ textTransform: 'capitalize' }}
                          >
                            {l.stage || 'New'}
                          </span>
                        </td>
                        <td className="mono">{l.phone || '—'}</td>
                        <td style={{ color: 'var(--ink-soft)', fontSize: '12px' }}>{l.last || 'Recently'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ORDERS & SALES */}
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
                  Delivered ({deliveredCount})
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
                  Active / In Transit ({pendingOrdersCount})
                </button>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--ink-soft)', border: '1px dashed var(--line)', borderRadius: '10px' }}>
                <Package className="w-10 h-10 text-wheat opacity-60" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600 }}>No orders recorded in this filter</div>
              </div>
            ) : (
              <div className="overflow-x-auto" style={{ border: '1px solid var(--line)', borderRadius: '8px' }}>
                <table>
                  <thead>
                    <tr style={{ background: '#FAFAF8' }}>
                      <th>Order ID</th>
                      <th>Distributor</th>
                      <th>Date / ETA</th>
                      <th>Products & Quantities</th>
                      <th>Order Value</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => (
                      <tr key={o.id}>
                        <td className="mono" style={{ fontWeight: 600 }}>
                          {o.id}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{o.dist}</td>
                        <td className="zoneword">{o.eta || o.date || '—'}</td>
                        <td className="zoneword">{o.qty || 'Standard bags'}</td>
                        <td className="mono" style={{ fontWeight: 700, color: 'var(--navy)' }}>
                          {computeOrderValue(o)}
                        </td>
                        <td>
                          <span className={`chip ${o.status || 'pending'}`} style={{ textTransform: 'capitalize' }}>
                            {ORDER_STATUS_LABELS[o.status] || o.status || 'Pending'}
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
                          >
                            <Eye className="w-3.5 h-3.5 text-wheat" />
                            <span>View</span>
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

        {/* TAB 4: PROFILE & ROLE INFO */}
        {activeTab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#FAFAF8', border: '1px solid var(--line)', borderRadius: '10px', padding: '18px' }}>
              <h4 style={{ margin: '0 0 14px', fontSize: '14px', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck className="w-4 h-4 text-wheat" />
                <span>Employment & Official Profile</span>
              </h4>
              <div style={{ fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>Full Legal Name</div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>{employee.name}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>Role / Designation</div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>{employee.role || '—'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>Official Mobile</div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>{employee.phone || '—'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>Work Email</div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>{employee.email || '—'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>Joining Date</div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>{employee.joined_date || '—'}</div>
                </div>
              </div>
            </div>

            <div style={{ background: '#FAFAF8', border: '1px solid var(--line)', borderRadius: '10px', padding: '18px' }}>
              <h4 style={{ margin: '0 0 14px', fontSize: '14px', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin className="w-4 h-4 text-wheat" />
                <span>Territory & Quota Summary</span>
              </h4>
              <div style={{ fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>Assigned Zone</div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>{employee.zone || '—'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>Headquarters City</div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>{employee.city || '—'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>Monthly Target Quota</div>
                  <div style={{ fontWeight: 700, color: 'var(--navy)', fontFamily: 'IBM Plex Mono, monospace', marginTop: '2px' }}>
                    {target > 0 ? `₹${target.toLocaleString('en-IN')}` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>Current Achievement</div>
                  <div style={{ fontWeight: 700, color: pct >= 80 ? 'var(--green)' : 'var(--amber)', fontFamily: 'IBM Plex Mono, monospace', marginTop: '2px' }}>
                    ₹{achieved.toLocaleString('en-IN')} ({pct}%)
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: '11px' }}>Account Status</div>
                  <div style={{ fontWeight: 600, color: employee.status === 'active' ? 'var(--green)' : 'var(--amber)', marginTop: '2px', textTransform: 'capitalize' }}>
                    {employee.status || 'Active'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Employee Modal */}
      <EmployeeModal
        isOpen={isEditModalOpen}
        employee={employee}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEmployee}
      />

      {/* View Order Modal */}
      <OrderDetailsModal
        isOpen={Boolean(selectedOrderForView)}
        order={selectedOrderForView}
        onClose={() => setSelectedOrderForView(null)}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Sales Representative"
        confirmText="Delete Representative"
        confirmVariant="danger"
        message={
          <>
            Are you sure you want to remove <b style={{ color: 'var(--ink)' }}>{employee.name}</b> ({employee.role}) from the sales team? This action cannot be undone.
          </>
        }
      />
    </div>
  );
};
