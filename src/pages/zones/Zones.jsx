import React, { useState, useEffect } from 'react';
import { zoneService } from '../../services/zoneService';
import { GrainGauge } from '../../components/common/GrainGauge';

export const Zones = () => {
  const [zones, setZones] = useState([]);

  useEffect(() => {
    zoneService.getAll().then(setZones);
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

      <div className="zonegrid">
        {zones.map((z, i) => (
          <div key={z.id || z.name} className="zonebig">
            <div className="ztitle">
              <h4>{z.name}</h4>
              <span className="zn-no">
                ZONE {i + 1 < 10 ? `0${i + 1}` : i + 1}
              </span>
            </div>

            <div className="breadcrumb-zone">
              Zone → <b>City</b> → Area
            </div>

            <GrainGauge percent={z.pct} className="mt-3.5" />

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
              <span className="mono">{z.pct}%</span>
            </div>

            <div className="citylist">
              {z.cities.map((c, cIdx) => (
                <div key={cIdx} className="citypill">
                  <b>{c[0]}</b> · {c[1]} distributors
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
