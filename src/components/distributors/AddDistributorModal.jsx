import React, { useState, useEffect, useMemo } from 'react';
import { Check, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { PhoneInput } from '../common/PhoneInput';
import { SearchableSelect } from '../common/SearchableSelect';
import { useToast } from '../../hooks/useToast';
import {
  GUJARAT_ZONES_TERRITORY,
  getCitiesForZone,
  getAreasForCity,
} from '../../data/gujaratTerritoryData';

export const AddDistributorModal = ({
  isOpen,
  onClose,
  zones = [],
  allDistributors = [],
  distributor = null,
  onAdd,
  onUpdate,
}) => {
  const isEditing = !!distributor?.id;
  const { showSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    zone: 'South Gujarat',
    city: '',
    area: '',
    target: 80,
    phone: '',
    gstin: '',
    sameBilling: true,
    billing: '',
  });

  useEffect(() => {
    if (distributor) {
      setFormData({
        name: distributor.name || '',
        zone: distributor.zone || 'South Gujarat',
        city: distributor.city || '',
        area: distributor.area || '',
        target: distributor.target !== undefined ? distributor.target : 80,
        phone: distributor.phone || '',
        gstin: distributor.gstin || '',
        sameBilling: !distributor.billing || distributor.billing === `${distributor.area}, ${distributor.city}`,
        billing: distributor.billing || '',
      });
    } else {
      setFormData({
        name: '',
        zone: zones[0]?.name || 'South Gujarat',
        city: '',
        area: '',
        target: 80,
        phone: '',
        gstin: '',
        sameBilling: true,
        billing: '',
      });
    }
  }, [distributor, isOpen, zones]);

  // Available cities for the selected zone
  const availableCities = useMemo(() => {
    return getCitiesForZone(formData.zone);
  }, [formData.zone]);

  // Available areas for the selected zone + city
  const availableAreas = useMemo(() => {
    return getAreasForCity(formData.zone, formData.city);
  }, [formData.zone, formData.city]);

  // Territory conflict detection (same city & same area)
  const territoryConflicts = useMemo(() => {
    const cCity = (formData.city || '').trim().toLowerCase();
    const cArea = (formData.area || '').trim().toLowerCase();
    if (!cCity || !cArea) return [];

    return (allDistributors || []).filter((d) => {
      if (isEditing && d.id === distributor?.id) return false;
      const dCity = (d.city || '').trim().toLowerCase();
      const dArea = (d.area || '').trim().toLowerCase();
      return dCity === cCity && dArea === cArea;
    });
  }, [allDistributors, formData.city, formData.area, isEditing, distributor]);

  const handleZoneChange = (newZone) => {
    const newCities = getCitiesForZone(newZone);
    const cityStillValid = newCities.some(
      (c) => c.toLowerCase() === formData.city.toLowerCase().trim()
    );

    setFormData((prev) => ({
      ...prev,
      zone: newZone,
      city: cityStillValid ? prev.city : '',
      area: cityStillValid ? prev.area : '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.zone || !formData.city || !formData.area) return;

    setLoading(true);
    const billingText = formData.sameBilling
      ? `${formData.area.trim()}, ${formData.city.trim()}`
      : formData.billing.trim();

    const distPayload = {
      name: formData.name.trim(),
      zone: formData.zone,
      city: formData.city.trim(),
      area: formData.area.trim(),
      target: parseInt(formData.target) || 0,
      outstanding: isEditing && distributor?.outstanding ? distributor.outstanding : '₹0',
      pay: isEditing && distributor?.pay ? distributor.pay : 'paid',
      phone: formData.phone.trim(),
      gstin: formData.gstin.trim(),
      billing: billingText,
    };

    try {
      if (isEditing && onUpdate) {
        await onUpdate(distPayload, distributor.id);
        showSuccess('Distributor Updated', `${distPayload.name} updated successfully.`);
      } else if (onAdd) {
        await onAdd(distPayload);
        showSuccess('Distributor Added', `${distPayload.name} is now active in ${distPayload.city} · ${distPayload.area}.`);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Distributor' : 'Add New Distributor'}
      maxWidth="580px"
      footer={
        <>
          <button className="btn-outline" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn-primary"
            type="button"
            disabled={loading}
            onClick={() => {
              const form = document.getElementById('addDistributorForm');
              if (form) form.requestSubmit();
            }}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            {isEditing ? 'Save Changes' : 'Add Distributor'}
          </button>
        </>
      }
    >
      <form id="addDistributorForm" onSubmit={handleSubmit}>
        <div className="f-group">
          <label>Distributor / Business Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Shree Ganesh Traders"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        {/* Zone Selector */}
        <div className="f-group" style={{ marginTop: '12px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Assigned Zone *</span>
            <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
              4 predefined Gujarat sales zones
            </span>
          </label>
          <select
            required
            value={formData.zone}
            onChange={(e) => handleZoneChange(e.target.value)}
          >
            {Object.keys(GUJARAT_ZONES_TERRITORY).map((zName) => (
              <option key={zName} value={zName}>
                {zName}
              </option>
            ))}
          </select>
        </div>

        {/* City & Area Selection with Custom Styled Searchable Dropdowns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '12px' }}>
          {/* City Field */}
          <div className="f-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>City / District *</span>
              {availableCities.length > 0 && (
                <span style={{ fontSize: '10.5px', color: 'var(--wheat)', fontWeight: 600 }}>
                  {availableCities.length} in zone
                </span>
              )}
            </label>
            <SearchableSelect
              value={formData.city}
              onChange={(c) => setFormData((prev) => ({ ...prev, city: c, area: '' }))}
              options={availableCities}
              placeholder="Select or type city..."
              required
            />
          </div>

          {/* Area Field */}
          <div className="f-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Area / Market *</span>
              {availableAreas.length > 0 && (
                <span style={{ fontSize: '10.5px', color: 'var(--wheat)', fontWeight: 600 }}>
                  {availableAreas.length} suggested
                </span>
              )}
            </label>
            <SearchableSelect
              value={formData.area}
              onChange={(a) => setFormData((prev) => ({ ...prev, area: a }))}
              options={availableAreas}
              placeholder="Select or type area..."
              disabled={!formData.city}
              required
            />
          </div>
        </div>

        {/* Territory Overlap / Conflict Alert Box */}
        {territoryConflicts.length > 0 ? (
          <div
            style={{
              marginTop: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: '#FFF8E6',
              border: '1.5px solid #F0C466',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <AlertTriangle className="w-4 h-4 text-amber flex-shrink-0" style={{ marginTop: '2px', color: '#B9832E' }} />
            <div style={{ fontSize: '12px', color: '#6A4800', lineHeight: 1.4 }}>
              <div style={{ fontWeight: 700, fontSize: '12.5px' }}>
                ⚠️ Territory Overlap Notice
              </div>
              <div style={{ marginTop: '2px' }}>
                <b>"{territoryConflicts[0].name}"</b> is already operating in{' '}
                <b>{formData.city} · {formData.area}</b> ({territoryConflicts[0].zone}).
              </div>
              <div style={{ marginTop: '2px', color: '#886214', fontSize: '11px' }}>
                Assigning multiple distributors to the exact same market area may lead to territorial overlap.
              </div>
            </div>
          </div>
        ) : formData.city.trim() && formData.area.trim() ? (
          <div
            style={{
              marginTop: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'var(--green-bg)',
              border: '1px solid rgba(61, 122, 92, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              color: 'var(--green)',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Territory Unique: No existing distributor registered in {formData.city} · {formData.area}.
            </span>
          </div>
        ) : null}

        {/* Target & Contact */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
          <div className="f-group">
            <label>1st Year Sales Target (%)</label>
            <input
              type="number"
              min="0"
              max="200"
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value })}
            />
          </div>

          <div className="f-group">
            <label>GSTIN (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 24ABCPT4567F1Z2"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
              style={{ textTransform: 'uppercase', fontFamily: 'IBM Plex Mono, monospace' }}
            />
          </div>
        </div>

        <div className="f-group" style={{ marginTop: '12px' }}>
          <label>Contact Number *</label>
          <PhoneInput
            value={formData.phone}
            onChange={(val) => setFormData({ ...formData, phone: val })}
            placeholder="98250 12345"
            required
          />
        </div>

        {/* Billing Address Option */}
        <div className="f-group" style={{ marginTop: '12px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '12.5px',
            }}
          >
            <input
              type="checkbox"
              checked={formData.sameBilling}
              onChange={(e) => setFormData({ ...formData, sameBilling: e.target.checked })}
              style={{ cursor: 'pointer' }}
            />
            <span>Billing address same as Area / City</span>
          </label>

          {!formData.sameBilling && (
            <textarea
              style={{
                marginTop: '8px',
                width: '100%',
                borderRadius: '6px',
                border: '1px solid var(--line)',
                padding: '8px 10px',
                fontSize: '12.5px',
                fontFamily: 'inherit',
              }}
              rows={2}
              placeholder="Enter full legal billing address..."
              value={formData.billing}
              onChange={(e) => setFormData({ ...formData, billing: e.target.value })}
            />
          )}
        </div>
      </form>
    </Modal>
  );
};
