import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { PhoneInput } from '../common/PhoneInput';
import { STAGE_LABELS } from '../../utils/constants';

const ZONES = ['South Gujarat', 'North Gujarat', 'Central Gujarat', 'Saurashtra'];
const OWNERS = ['R. Joshi', 'K. Patel', 'M. Shah', 'Ankur K. (Admin)'];

export const AddLeadModal = ({
  isOpen,
  onClose,
  lead = null,
  onAdd,
  onUpdate,
}) => {
  const isEditing = !!lead?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    zone: 'South Gujarat',
    stage: 'new',
    owner: 'R. Joshi',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        zone: lead.zone || 'South Gujarat',
        stage: lead.stage || 'new',
        owner: lead.owner || 'R. Joshi',
        phone: lead.phone || '',
        notes: lead.notes || '',
      });
    } else {
      setFormData({
        name: '',
        zone: 'South Gujarat',
        stage: 'new',
        owner: 'R. Joshi',
        phone: '',
        notes: '',
      });
    }
  }, [lead, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (isEditing && onUpdate) {
        await onUpdate(formData, lead.id);
      } else if (onAdd) {
        await onAdd(formData);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Lead' : 'Add New Lead'}
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
              const form = document.getElementById('addLeadForm');
              if (form) form.requestSubmit();
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {isEditing ? 'Saving...' : 'Adding...'}
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" /> {isEditing ? 'Save Changes' : 'Add Lead'}
              </>
            )}
          </button>
        </>
      }
    >
      <form id="addLeadForm" onSubmit={handleSubmit}>
        <div className="f-group">
          <label>Lead / Business Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Vraj Kirana Store"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={isSubmitting}
          />
        </div>

        <div className="f-row">
          <div className="f-group">
            <label>Zone *</label>
            <select
              value={formData.zone}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
              disabled={isSubmitting}
            >
              {ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          <div className="f-group">
            <label>Pipeline Stage</label>
            <select
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              disabled={isSubmitting}
            >
              {Object.entries(STAGE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="f-row">
          <div className="f-group">
            <label>Assigned Owner</label>
            <select
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              disabled={isSubmitting}
            >
              {OWNERS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div className="f-group">
            <label>Contact Phone (optional)</label>
            <PhoneInput
              value={formData.phone}
              onChange={(val) => setFormData({ ...formData, phone: val })}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="f-group">
          <label>Notes / Requirements (optional)</label>
          <input
            type="text"
            placeholder="e.g. Interested in Chakki Fresh Atta 30kg bulk"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            disabled={isSubmitting}
          />
        </div>
      </form>
    </Modal>
  );
};
