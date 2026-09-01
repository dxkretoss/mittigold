import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle, FileText, Package, AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { computeOrderValue } from '../../utils/orderPriceHelper';
import { formatDateDisplay } from '../../utils/formatDate';

const COMMON_VEHICLES = [
  'Tata Ace · GJ-01-AB-1123',
  'Tata 407 · GJ-07-BX-4410',
  'Eicher · GJ-01-CT-8842',
  'Mahindra Bolero Maxi Truck',
  'Ashok Leyland Dost',
];

export const DispatchModal = ({
  isOpen,
  onClose,
  order,
  onConfirmDispatch,
}) => {
  const [transport, setTransport] = useState('');
  const [customTransport, setCustomTransport] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (isOpen && order) {
      const existingTransport = order.transport === '—' ? '' : order.transport || '';
      if (COMMON_VEHICLES.includes(existingTransport)) {
        setTransport(existingTransport);
        setCustomTransport('');
      } else if (existingTransport) {
        setTransport('custom');
        setCustomTransport(existingTransport);
      } else {
        setTransport(COMMON_VEHICLES[0]);
        setCustomTransport('');
      }
      setDispatchDate(todayStr);
      setDriverName('');
      setDriverPhone('');
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const orderVal = computeOrderValue(order);
  const finalTransport = transport === 'custom' ? customTransport.trim() : transport;

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!finalTransport) return;

    setIsSubmitting(true);
    try {
      await onConfirmDispatch({
        order,
        transport: finalTransport,
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        dispatchDate: formatDateDisplay(dispatchDate),
        orderVal,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Dispatch Order ${order.id}`}
      maxWidth="560px"
    >
      <form onSubmit={handleConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Order & Distributor Banner */}
        <div style={{ background: '#FAF9F5', border: '1px solid var(--line)', borderRadius: '10px', padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Distributor
              </span>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy)' }}>
                {order.dist}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Invoice Amount
              </span>
              <div className="mono" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--green)' }}>
                {orderVal}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed var(--line)', paddingTop: '10px', marginTop: '6px' }}>
            <div style={{ fontSize: '12px', color: 'var(--ink)' }}>
              <span style={{ fontWeight: 600 }}>Items to Dispatch:</span> {order.qty}
            </div>
            {order.original_qty && order.original_qty !== order.qty && (
              <div style={{ fontSize: '11px', color: 'var(--amber)', marginTop: '3px' }}>
                * Originally requested: {order.original_qty} (Adjusted by Admin)
              </div>
            )}
          </div>
        </div>

        {/* Automatic Invoice Generation Notice */}
        <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(61, 122, 92, 0.25)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText className="w-5 h-5 text-green flex-shrink-0" />
          <div style={{ fontSize: '12px', color: 'var(--green)', lineHeight: 1.4 }}>
            <strong>Automatic Tax Invoice:</strong> Changing status to <strong>Dispatched</strong> will automatically generate and issue a tax invoice for <strong>{orderVal}</strong> to {order.dist}.
          </div>
        </div>

        {/* Transport Fleet Assignment */}
        <div className="f-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '12.5px', color: 'var(--navy)' }}>
            <Truck className="w-4 h-4 text-wheat" />
            Assign Transport / Delivery Vehicle *
          </label>
          <select
            value={transport}
            onChange={(e) => setTransport(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '7px',
              border: '1px solid var(--line)',
              fontSize: '13px',
              background: '#FFFFFF',
              color: 'var(--ink)',
            }}
            required
          >
            {COMMON_VEHICLES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
            <option value="custom">Other / Custom Vehicle...</option>
          </select>
        </div>

        {transport === 'custom' && (
          <div className="f-group">
            <label style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Enter Vehicle Make & Reg Number *</label>
            <input
              type="text"
              placeholder="e.g. Ashok Leyland · GJ-06-XX-9900"
              value={customTransport}
              onChange={(e) => setCustomTransport(e.target.value)}
              required
            />
          </div>
        )}

        {/* Dispatch Date & Driver Details (2-col) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="f-group">
            <label style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Dispatch Date *</label>
            <input
              type="date"
              value={dispatchDate}
              onChange={(e) => setDispatchDate(e.target.value)}
              required
            />
          </div>

          <div className="f-group">
            <label style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Driver Name (Optional)</label>
            <input
              type="text"
              placeholder="Driver name"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !finalTransport}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Dispatch...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Confirm Dispatch & Create Invoice</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
