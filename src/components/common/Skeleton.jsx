import React from 'react';

export const Skeleton = ({
  variant = 'text',
  width,
  height,
  size,
  className = '',
  style = {},
  rows = 5,
  cols = 5,
  count = 4,
}) => {
  if (variant === 'circle') {
    const s = size || width || height || '38px';
    return (
      <span
        className={`skeleton-shimmer ${className}`}
        style={{
          width: s,
          height: s,
          borderRadius: '50%',
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  if (variant === 'rect') {
    return (
      <span
        className={`skeleton-shimmer ${className}`}
        style={{
          width: width || '100%',
          height: height || '40px',
          borderRadius: '8px',
          ...style,
        }}
      />
    );
  }

  if (variant === 'table') {
    return (
      <div style={{ width: '100%', ...style }}>
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div
            key={rIdx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              padding: '14px 18px',
              borderBottom: '1px solid var(--line)',
            }}
          >
            {Array.from({ length: cols }).map((_, cIdx) => (
              <span
                key={cIdx}
                className="skeleton-shimmer"
                style={{
                  height: '14px',
                  width: cIdx === 0 ? '22%' : cIdx === cols - 1 ? '12%' : '18%',
                  borderRadius: '4px',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'kpi') {
    return (
      <div className="kpirow" style={{ ...style }}>
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="kpi" style={{ minHeight: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="skeleton-shimmer" style={{ width: '45%', height: '12px', borderRadius: '4px' }} />
              <span className="skeleton-shimmer" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
            </div>
            <div style={{ marginTop: '12px' }}>
              <span className="skeleton-shimmer" style={{ width: '70%', height: '26px', borderRadius: '6px' }} />
            </div>
            <div style={{ marginTop: '8px' }}>
              <span className="skeleton-shimmer" style={{ width: '35%', height: '11px', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className="prodgrid" style={{ ...style }}>
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="prodcard" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className="skeleton-shimmer" style={{ width: '50%', height: '16px', borderRadius: '4px' }} />
              <span className="skeleton-shimmer" style={{ width: '25%', height: '18px', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <span className="skeleton-shimmer" style={{ width: '30%', height: '22px', borderRadius: '6px' }} />
              <span className="skeleton-shimmer" style={{ width: '30%', height: '22px', borderRadius: '6px' }} />
            </div>
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
              <span className="skeleton-shimmer" style={{ width: '35%', height: '12px', borderRadius: '4px' }} />
              <span className="skeleton-shimmer" style={{ width: '20%', height: '12px', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default: text line
  return (
    <span
      className={`skeleton-shimmer ${className}`}
      style={{
        width: width || '100%',
        height: height || '14px',
        borderRadius: '4px',
        ...style,
      }}
    />
  );
};
