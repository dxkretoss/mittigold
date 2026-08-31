import React from 'react';
import { GrainGauge } from '../common/GrainGauge';

export const ZonePerformanceCard = ({ zones = [] }) => {
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h3>Zone Performance</h3>
          <div className="hint">Share of total sales</div>
        </div>
      </div>
      <div className="panel-body">
        {zones.map((z, idx) => (
          <div
            key={z.id || z.name}
            className="flex items-center gap-3.5 py-3.5 border-b border-dashed border-line last:border-b-0"
          >
            <div className="w-[104px] flex-shrink-0 text-[12.8px] font-bold text-navy">
              {z.name}
            </div>
            <div className="flex-1">
              <GrainGauge percent={z.pct} />
            </div>
            <div className="w-[70px] text-right font-mono text-xs text-ink-soft flex-shrink-0">
              {z.sales}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
