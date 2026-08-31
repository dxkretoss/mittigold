import React, { useState, useEffect } from 'react';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { BestDistributorsTable } from '../../components/dashboard/BestDistributorsTable';
import { ZonePerformanceCard } from '../../components/dashboard/ZonePerformanceCard';
import { RecentLeadsTable } from '../../components/dashboard/RecentLeadsTable';
import { OrdersAwaitingDispatchTable } from '../../components/dashboard/OrdersAwaitingDispatchTable';
import { Skeleton } from '../../components/common/Skeleton';

import { dashboardService } from '../../services/dashboardService';
import { distributorService } from '../../services/distributorService';
import { zoneService } from '../../services/zoneService';
import { leadService } from '../../services/leadService';
import { orderService } from '../../services/orderService';

export const Dashboard = () => {
  const [kpis, setKpis] = useState([]);
  const [bestDistributors, setBestDistributors] = useState([]);
  const [zones, setZones] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [awaitingOrders, setAwaitingOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [kpiData, distroData, zoneData, leadData, orderData] = await Promise.all([
        dashboardService.getKpis(),
        dashboardService.getBestDistributors(5),
        dashboardService.getZoneMetrics(),
        leadService.getRecent(4),
        orderService.getAwaitingDispatch(4),
      ]);

      setKpis(kpiData || []);
      setBestDistributors(distroData || []);
      setZones(zoneData || []);
      setRecentLeads(leadData || []);
      setAwaitingOrders(orderData || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('mittigold-order-created', handleUpdate);
    window.addEventListener('mittigold-order-updated', handleUpdate);
    window.addEventListener('mittigold-lead-updated', handleUpdate);
    window.addEventListener('mittigold-lead-created', handleUpdate);

    return () => {
      window.removeEventListener('mittigold-order-created', handleUpdate);
      window.removeEventListener('mittigold-order-updated', handleUpdate);
      window.removeEventListener('mittigold-lead-updated', handleUpdate);
      window.removeEventListener('mittigold-lead-created', handleUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="kpi" count={4} />
        <div className="grid2">
          <div className="panel" style={{ padding: '16px' }}>
            <Skeleton variant="text" width="40%" height="20px" style={{ marginBottom: '16px' }} />
            <Skeleton variant="table" rows={4} cols={4} />
          </div>
          <div className="panel" style={{ padding: '16px' }}>
            <Skeleton variant="text" width="40%" height="20px" style={{ marginBottom: '16px' }} />
            <Skeleton variant="rect" width="100%" height="160px" />
          </div>
        </div>
        <div className="grid2" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="panel" style={{ padding: '16px' }}>
            <Skeleton variant="text" width="40%" height="20px" style={{ marginBottom: '16px' }} />
            <Skeleton variant="table" rows={3} cols={3} />
          </div>
          <div className="panel" style={{ padding: '16px' }}>
            <Skeleton variant="text" width="40%" height="20px" style={{ marginBottom: '16px' }} />
            <Skeleton variant="table" rows={3} cols={3} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards */}
      <div className="kpirow">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} {...kpi} />
        ))}
      </div>

      {/* Grid: Best Distributors + Zone Performance */}
      <div className="grid2">
        <BestDistributorsTable distributors={bestDistributors} />
        <ZonePerformanceCard zones={zones} />
      </div>

      {/* Grid: Recent Leads + Orders Awaiting Dispatch */}
      <div className="grid2" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <RecentLeadsTable leads={recentLeads} />
        <OrdersAwaitingDispatchTable orders={awaitingOrders} />
      </div>
    </div>
  );
};
