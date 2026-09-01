import React, { useState, useEffect } from 'react';
import { Target, Pencil } from 'lucide-react';
import { zoneService } from '../../services/zoneService';
import { GrainGauge } from '../../components/common/GrainGauge';
import { Skeleton } from '../../components/common/Skeleton';
import { SetZoneTargetModal } from '../../components/zones/SetZoneTargetModal';

export const Zones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  const loadZones = async () => {
    try {
      setLoading(true);
      const data = await zoneService.getAll();
      setZones(data || []);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones();

    const handleUpdate = () => {
      loadZones();
    };

    window.addEventListener('mittigold-distributor-created', handleUpdate);
    window.addEventListener('mittigold-distributor-updated', handleUpdate);
    window.addEventListener('mittigold-distributor-deleted', handleUpdate);
    window.addEventListener('mittigold-order-created', handleUpdate);
    window.addEventListener('mittigold-zone-updated', handleUpdate);
    window.addEventListener('mittigold-zone-target-updated', handleUpdate);

    return () => {
      window.removeEventListener('mittigold-distributor-created', handleUpdate);
      window.removeEventListener('mittigold-distributor-updated', handleUpdate);
      window.removeEventListener('mittigold-distributor-deleted', handleUpdate);
      window.removeEventListener('mittigold-order-created', handleUpdate);
      window.removeEventListener('mittigold-zone-updated', handleUpdate);
      window.removeEventListener('mittigold-zone-target-updated', handleUpdate);
    };
  }, []);

  const handleOpenTargetModal = (zone) => {
    setSelectedZone(zone);
    setIsTargetModalOpen(true);
  };

  const handleTargetUpdated = () => {
    loadZones();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', margin: '-6px 0 22px' }}>
        <p
          style={{
            color: 'var(--ink-soft)',
            maxWidth: '640px',
            margin: 0,
            fontSize: '13.5px',
          }}
        >
          4 predefined zones, linked to the Distributor module. Admin can configure sales targets for each zone to track live performance and fill lines.
        </p>
      </div>

      {loading ? (
        <div className="zonegrid">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="zonebig" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <Skeleton variant="text" width="50%" height="18px" />
                <Skeleton variant="rect" width="60px" height="20px" />
              </div>
              <Skeleton variant="rect" width="100%" height="50px" style={{ marginBottom: '16px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Skeleton variant="text" width="30%" height="14px" />
                <Skeleton variant="text" width="20%" height="14px" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="zonegrid">
          {zones.map((z, i) => (
            <div key={z.id || z.name} className="zonebig">
              <div className="ztitle">
                <div>
                  <h4>{z.name}</h4>
                  <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px' }}>
                    <b>{z.totalDistributors || 0}</b> active {z.totalDistributors === 1 ? 'distributor' : 'distributors'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenTargetModal(z)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 9px',
                      background: 'var(--slate-bg)',
                      border: '1px solid var(--line)',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      color: 'var(--ink)',
                      cursor: 'pointer',
                      transition: 'all .15s ease',
                    }}
                    title="Click to change target for this zone"
                  >
                    <Target className="w-3.5 h-3.5" style={{ color: 'var(--wheat)' }} />
                    <span style={{ color: 'var(--ink-soft)' }}>Target:</span>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--navy)' }}>
                      {z.formattedTarget}
                    </span>
                    <Pencil className="w-3 h-3" style={{ color: 'var(--ink-soft)', marginLeft: '2px' }} />
                  </button>
                  <span className="zn-no">
                    ZONE {z.zone_number ? (z.zone_number < 10 ? `0${z.zone_number}` : z.zone_number) : (i + 1 < 10 ? `0${i + 1}` : i + 1)}
                  </span>
                </div>
              </div>

              <div className="breadcrumb-zone" style={{ marginTop: '8px', marginBottom: '12px' }}>
                Zone → <b>City</b> → Area
              </div>

              <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                <GrainGauge
                  percent={z.achievementPct || 0}
                  color={z.achievementPct >= 100 ? 'green' : ''}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                  fontSize: '11.5px',
                  color: 'var(--ink-soft)',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>Sales:</span>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--ink)' }}>
                    {z.sales || '₹0'}
                  </span>
                  <span style={{ color: 'var(--line)', margin: '0 2px' }}>/</span>
                  <span className="mono" style={{ color: 'var(--ink-soft)' }}>
                    {z.formattedTarget}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                    Share: <b className="mono">{z.pct || 0}%</b>
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: z.achievementPct >= 100 ? 'var(--green)' : 'var(--navy)',
                      background: z.achievementPct >= 100 ? 'var(--green-bg)' : 'var(--slate-bg)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11.5px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <span className="mono">{z.formattedAchievement || `${z.achievementPct || 0}%`}</span> achieved
                  </span>
                </div>
              </div>

              <div className="citylist">
                {z.cities && z.cities.length > 0 ? (
                  z.cities.map(([cityName, count], cIdx) => (
                    <div key={cIdx} className="citypill">
                      <b>{cityName}</b> · {count} {count === 1 ? 'distributor' : 'distributors'}
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)', fontStyle: 'italic', paddingTop: '4px' }}>
                    No distributors registered in this zone yet
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Target Setting Modal */}
      {selectedZone && (
        <SetZoneTargetModal
          isOpen={isTargetModalOpen}
          onClose={() => {
            setIsTargetModalOpen(false);
            setSelectedZone(null);
          }}
          zone={selectedZone}
          onTargetUpdated={handleTargetUpdated}
        />
      )}
    </div>
  );
};
