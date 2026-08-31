import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { zoneService } from '../../services/zoneService';
import { GrainGauge } from '../../components/common/GrainGauge';

export const Zones = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

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

    return () => {
      window.removeEventListener('mittigold-distributor-created', handleUpdate);
      window.removeEventListener('mittigold-distributor-updated', handleUpdate);
      window.removeEventListener('mittigold-distributor-deleted', handleUpdate);
      window.removeEventListener('mittigold-order-created', handleUpdate);
    };
  }, []);

  return (
    <div>
      <p
        style={{
          color: 'var(--ink-soft)',
          maxWidth: '640px',
          margin: '-6px 0 22px',
          fontSize: '13.5px',
        }}
      >
        4 predefined zones, linked only to the Distributor module. Assigned once — Zone → City → Area — when Admin adds a new distributor.
      </p>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-soft)' }}>
          <Loader2 className="w-7 h-7 animate-spin mx-auto text-wheat mb-2" />
          <div style={{ fontSize: '13px' }}>Calculating zone metrics from database...</div>
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
                <span className="zn-no">
                  ZONE {z.zone_number ? (z.zone_number < 10 ? `0${z.zone_number}` : z.zone_number) : (i + 1 < 10 ? `0${i + 1}` : i + 1)}
                </span>
              </div>

              <div className="breadcrumb-zone" style={{ marginTop: '8px' }}>
                Zone → <b>City</b> → Area
              </div>

              <GrainGauge percent={z.pct || 0} className="mt-3.5" />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '6px',
                  fontSize: '11.5px',
                  color: 'var(--ink-soft)',
                }}
              >
                <span>Share of total sales</span>
                <span className="mono">{z.pct || 0}%</span>
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
    </div>
  );
};
