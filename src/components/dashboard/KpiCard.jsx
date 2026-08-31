import React from 'react';
import { IndianRupee, Calendar, Clock, Store } from 'lucide-react';

const ICON_MAP = {
  IndianRupee,
  Calendar,
  Clock,
  Store,
};

export const KpiCard = ({
  label,
  value,
  delta,
  deltaType = 'up', // 'up', 'down'
  glyphBg,
  glyphStroke,
  icon,
}) => {
  const IconComponent = ICON_MAP[icon] || IndianRupee;

  return (
    <div className="kpi">
      <div className="glyph" style={{ background: glyphBg }}>
        <IconComponent
          className="w-4 h-4"
          style={{ stroke: glyphStroke, color: glyphStroke }}
        />
      </div>
      <div className="k">{label}</div>
      <div className="v">{value}</div>
      <div className={`delta ${deltaType}`}>
        {delta}
      </div>
    </div>
  );
};
