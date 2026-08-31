import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useToast } from '../../hooks/useToast';

export const AddBrokerModal = ({
  isOpen,
  onClose,
  broker = null,
  onAdd,
  onUpdate,
}) => {
  const isEditing = !!broker?.id;
  const { showSuccess } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    rate: 5,
    orders: 0,
    paid: '',
    pending: '',
  });

  useEffect(() => {
    if (broker) {
      const cleanPaid = (broker.paid || '').replace(/[^0-9.]/g, '');
      const cleanPending = (broker.pending || '').replace(/[^0-9.]/g, '');
      setFormData({
        name: broker.name || '',
        phone: broker.phone || '',
        rate: broker.rate !== undefined ? broker.rate : 5,
        orders: broker.orders !== undefined ? broker.orders : 0,
        paid: cleanPaid !== '0' ? cleanPaid : '',
        pending: cleanPending !== '0' ? cleanPending : '',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        rate: 5,
        orders: 0,
        paid: '',
        pending: '',
      });
    }
    setError('');
  }, [broker, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please enter a broker / agency name.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const ordersCount = parseInt(formData.orders, 10) || 0;
      const paidVal = parseFloat((formData.paid || '0').replace(/[^0-9.]/g, '')) || 0;
      const pendingVal = parseFloat((formData.pending || '0').replace(/[^0-9.]/g, '')) || 0;
      const totalCommission = paidVal + pendingVal;

      const brokerPayload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        rate: parseFloat(formData.rate) || 5,
        orders: ordersCount,
        commission: totalCommission > 0 ? `₹${totalCommission.toLocaleString('en-IN')}` : '₹0',
        paid: paidVal > 0 ? `₹${paidVal.toLocaleString('en-IN')}` : '₹0',
        pending: pendingVal > 0 ? `₹${pendingVal.toLocaleString('en-IN')}` : '₹0',
      };

      if (isEditing && onUpdate) {
        await onUpdate(brokerPayload, broker.id);
        showSuccess('Broker Updated', `${brokerPayload.name} details have been updated.`);
      } else if (onAdd) {
        await onAdd(brokerPayload);
        showSuccess('Broker Added', `${brokerPayload.name} has been added to the broker network.`);
      }

      setFormData({ name: '', phone: '', rate: 5, orders: 0, paid: '', pending: '' });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save broker. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    if (!isSubmitting) {
      setError('');
      setFormData({ name: '', phone: '', rate: 5, orders: 0, paid: '', pending: '' });
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={isEditing ? 'Edit Broker' : 'Add New Broker'}
      footer={
        <>
          <button className="btn-outline" type="button" onClick={handleModalClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            className="btn-primary"
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              const form = document.getElementById('addBrokerForm');
              if (form) form.requestSubmit();
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {isEditing ? 'Saving...' : 'Adding...'}
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" /> {isEditing ? 'Save Changes' : 'Add Broker'}
              </>
            )}
          </button>
        </>
      }
    >
      <form id="addBrokerForm" onSubmit={handleSubmit}>
        <div className="f-group">
          <label>Broker / Agency Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Desai Agency"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={isSubmitting}
          />
        </div>

        <div className="f-row">
          <div className="f-group">
            <label>Contact Phone</label>
            <input
              type="tel"
              placeholder="+91 98250 12345"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={isSubmitting}
            />
          </div>
          <div className="f-group">
            <label>Commission Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="f-row">
          <div className="f-group">
            <label>Total Completed Orders</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={formData.orders}
              onChange={(e) => setFormData({ ...formData, orders: e.target.value })}
              disabled={isSubmitting}
            />
          </div>
          <div className="f-group">
            <label>Commission Paid (₹)</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={formData.paid}
              onChange={(e) => setFormData({ ...formData, paid: e.target.value })}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="f-group">
          <label>Commission Pending (₹)</label>
          <input
            type="number"
            min="0"
            placeholder="0"
            value={formData.pending}
            onChange={(e) => setFormData({ ...formData, pending: e.target.value })}
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <div
            style={{
              fontSize: '12px',
              color: 'var(--red)',
              margin: '8px 0',
              background: 'var(--red-bg)',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(178, 72, 58, 0.2)',
            }}
          >
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
};

