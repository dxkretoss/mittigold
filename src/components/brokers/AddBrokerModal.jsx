import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { PhoneInput } from '../common/PhoneInput';
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
  });

  useEffect(() => {
    if (broker) {
      setFormData({
        name: broker.name || '',
        phone: broker.phone || '',
        rate: broker.rate !== undefined ? broker.rate : 5,
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        rate: 5,
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
      const brokerPayload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        rate: parseFloat(formData.rate) || 5,
        orders: isEditing && broker.orders !== undefined ? broker.orders : 0,
        commission: isEditing && broker.commission ? broker.commission : '₹0',
        paid: isEditing && broker.paid ? broker.paid : '₹0',
        pending: isEditing && broker.pending ? broker.pending : '₹0',
      };

      if (isEditing && onUpdate) {
        await onUpdate(brokerPayload, broker.id);
        showSuccess('Broker Updated', `${brokerPayload.name} details have been updated.`);
      } else if (onAdd) {
        await onAdd(brokerPayload);
        showSuccess('Broker Added', `${brokerPayload.name} has been added to the broker network.`);
      }

      setFormData({ name: '', phone: '', rate: 5 });
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
      setFormData({ name: '', phone: '', rate: 5 });
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
            <PhoneInput
              value={formData.phone}
              onChange={(val) => setFormData({ ...formData, phone: val })}
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
