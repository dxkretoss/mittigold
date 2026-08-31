import React from 'react';

export const GrainGauge = ({
  percent = 0,
  color = '', // 'blue', 'green', 'red' or default wheat
  showLabel = false,
  label = '',
  showPercent = false,
  className = '',
  trackClassName = '',
}) => {
  const clampedPercent = Math.max(0, Math.min(100, percent));

  if (showLabel || showPercent) {
    return (
      <div className={`gfill-row ${className}`}>
        {showLabel && <div className="lbl">{label}</div>}
        <div className="fill-wrap flex-1">
          <div className={`gfill-track ${trackClassName}`}>
            <div
              className={`gfill ${color}`}
              style={{ width: `${clampedPercent}%` }}
            />
          </div>
        </div>
        {showPercent && <div className="pct">{percent}%</div>}
      </div>
    );
  }

  return (
    <div className={`gfill-track ${trackClassName} ${className}`}>
      <div
        className={`gfill ${color}`}
        style={{ width: `${clampedPercent}%` }}
      />
    </div>
  );
};
