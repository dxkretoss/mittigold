import React from 'react';
import { GrainGauge } from '../common/GrainGauge';

export const ZonePerformanceCard = ({ zones = [] }) => {
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h3>Zone Performance</h3>
          <div className="hint">Target achievement & sales progress</div>
        </div>
      </div>
      <div className="panel-body">
        {zones.map((z) => (
          <div
            key={z.id || z.name}
            className="flex items-center gap-3.5 py-3 border-b border-dashed border-line last:border-b-0"
          >
            <div className="w-[120px] flex-shrink-0">
              <div className="text-[12.8px] font-bold text-navy leading-tight">{z.name}</div>
              <div className="text-[11px] text-ink-soft font-mono mt-0.5">
                Target: <span className="font-semibold text-ink">{z.formattedTarget || '₹1,00,000'}</span>
              </div>
            </div>
            <div className="flex-1">
              <GrainGauge
                percent={z.achievementPct || 0}
                color={z.achievementPct >= 100 ? 'green' : ''}
              />
            </div>
            <div className="text-right font-mono text-xs text-ink-soft flex-shrink-0 flex flex-col items-end justify-center min-w-[105px]">
              <div className="flex items-center gap-1.5">
                <span
                  className="font-bold"
                  style={{
                    color: z.achievementPct >= 100 ? 'var(--green)' : 'var(--navy)',
                  }}
                >
                  {z.formattedAchievement || `${z.achievementPct || 0}%`}
                </span>
                <span className="text-ink-faint">·</span>
                <span className="font-semibold text-ink">{z.sales}</span>
              </div>
              <div className="text-[10.5px] text-ink-faint mt-0.5">
                Share: {z.pct || 0}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
