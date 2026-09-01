import React, { useState, useEffect } from 'react';
import { Target, Check, Loader2, TrendingUp } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useToast } from '../../hooks/useToast';
import { zoneService } from '../../services/zoneService';
import { formatIndianCurrencyWords, formatAchievementPercent } from '../../utils/helpers';

const PRESET_TARGETS = [
  { val: 50000, lbl: '₹50k' },
  { val: 80000, lbl: '₹80k' },
  { val: 100000, lbl: '₹1 Lakh' },
  { val: 150000, lbl: '₹1.5 Lakh' },
  { val: 200000, lbl: '₹2 Lakh' },
  { val: 500000, lbl: '₹5 Lakh' },
  { val: 1000000, lbl: '₹10 Lakh' },
];

export const SetZoneTargetModal = ({
  isOpen,
  onClose,
  zone = null,
  onTargetUpdated,
}) => {
  const { showSuccess } = useToast();
  const [targetValue, setTargetValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (zone) {
      setTargetValue(zone.target !== undefined ? String(zone.target) : '100000');
      setError('');
    }
  }, [zone, isOpen]);

  if (!zone) return null;

  const numericTarget = parseFloat(String(targetValue).replace(/[^0-9.]/g, '')) || 0;
  const salesVal = zone.salesVal || 0;
  const rawProjectedPct = numericTarget > 0 ? (salesVal / numericTarget) * 100 : 0;
  const formattedProjected = formatAchievementPercent(salesVal, numericTarget);
  const targetWords = formatIndianCurrencyWords(numericTarget);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (numericTarget <= 0) {
      setError('Please enter a target amount greater than ₹0');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await zoneService.updateTarget(zone.id || zone.name, numericTarget);
      const targetLabel = targetWords ? `₹${numericTarget.toLocaleString('en-IN')} (${targetWords})` : `₹${numericTarget.toLocaleString('en-IN')}`;
      showSuccess('Target Updated', `${zone.name} target set to ${targetLabel}`);
      if (onTargetUpdated) {
        onTargetUpdated(zone.id, numericTarget);
      }
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to update zone target');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Set Target — ${zone.name}`}
      maxWidth="500px"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: 'var(--slate-bg)',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'IBM Plex Mono, monospace',
                  color: 'var(--wheat)',
                  textTransform: 'uppercase',
                }}
              >
                ZONE {zone.zone_number ? (zone.zone_number < 10 ? `0${zone.zone_number}` : zone.zone_number) : '01'}
              </span>
              <h4 style={{ margin: '2px 0 0', fontSize: '15px', color: 'var(--navy)' }}>
                {zone.name}
              </h4>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Current Sales Achieved</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'IBM Plex Mono, monospace' }}>
                {zone.sales || '₹0'}
              </div>
            </div>
          </div>

          <div className="f-group" style={{ marginBottom: '14px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Monthly Target Amount (₹) *</span>
              {numericTarget > 0 && (
                <span className="mono" style={{ fontSize: '12px', color: 'var(--wheat)', fontWeight: 600 }}>
                  ₹{numericTarget.toLocaleString('en-IN')} {targetWords ? `(${targetWords})` : ''}
                </span>
              )}
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontWeight: 600,
                  color: 'var(--ink-soft)',
                  fontFamily: 'IBM Plex Mono, monospace',
                }}
              >
                ₹
              </span>
              <input
                type="number"
                min="1000"
                step="1000"
                value={targetValue}
                onChange={(e) => {
                  setTargetValue(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. 200000"
                style={{
                  paddingLeft: '28px',
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
                autoFocus
                required
              />
            </div>
            {error && (
              <div style={{ color: 'var(--red)', fontSize: '11.5px', marginTop: '4px' }}>
                {error}
              </div>
            )}
          </div>

          {/* Quick presets */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginBottom: '6px', fontWeight: 600 }}>
              Quick Target Presets
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {PRESET_TARGETS.map((p) => {
                const isSelected = numericTarget === p.val;
                return (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setTargetValue(String(p.val))}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      borderRadius: '6px',
                      border: `1px solid ${isSelected ? 'var(--wheat)' : 'var(--line)'}`,
                      background: isSelected ? 'var(--amber-bg)' : '#fff',
                      color: isSelected ? 'var(--navy)' : 'var(--ink)',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all .15s ease',
                    }}
                  >
                    {p.lbl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Achievement Forecast */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px dashed var(--line)',
              background: '#FAFAF8',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingUp className="w-3.5 h-3.5 text-wheat" />
                Forecasted Target Fill Rate
              </span>
              <span
                className="mono"
                style={{
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: rawProjectedPct >= 100 ? 'var(--green)' : 'var(--navy)',
                }}
              >
                {formattedProjected} Achieved
              </span>
            </div>
            <div className="gfill-track" style={{ height: '8px', borderRadius: '4px' }}>
              <div
                className={`gfill ${rawProjectedPct >= 100 ? 'green' : ''}`}
                style={{ width: `${Math.max(0, Math.min(100, rawProjectedPct))}%`, height: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--ink-faint)' }}>
              <span>Sales: {zone.sales || '₹0'}</span>
              <span>Target: ₹{numericTarget.toLocaleString('en-IN')} {targetWords ? `(${targetWords})` : ''}</span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            paddingTop: '12px',
            borderTop: '1px solid var(--line)',
          }}
        >
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || numericTarget <= 0}
            style={{ minWidth: '130px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Target</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
