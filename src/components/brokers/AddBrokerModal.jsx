import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useToast } from '../../hooks/useToast';

export const AddBrokerModal = ({ isOpen, onClose, onAdd }) => {
  const { showSuccess } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    rate: 5,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    const newBroker = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      rate: parseFloat(formData.rate) || 5,
      orders: 0,
      commission: '₹0',
      paid: '₹0',
      pending: '₹0',
    };

    onAdd(newBroker);
    showSuccess('Broker Added', `${newBroker.name} has been added to the broker network.`);
    onClose();

    setFormData({ name: '', phone: '', rate: 5 });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Broker"
      footer={
        <>
          <button className="btn-outline" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            type="button"
            onClick={() => {
              const form = document.getElementById('addBrokerForm');
              if (form) form.requestSubmit();
            }}
          >
            <Check className="w-3.5 h-3.5" /> Add Broker
          </button>
        </>
      }
    >
      <form id="addBrokerForm" onSubmit={handleSubmit}>
        <div className="f-group">
          <label>Broker / Agency Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Desai Agency"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="f-row">
          <div className="f-group">
            <label>Contact Number</label>
            <input
              type="tel"
              placeholder="+91 90000 00000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
