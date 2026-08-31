import React, { useState, useEffect } from 'react';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { BestDistributorsTable } from '../../components/dashboard/BestDistributorsTable';
import { ZonePerformanceCard } from '../../components/dashboard/ZonePerformanceCard';
import { RecentLeadsTable } from '../../components/dashboard/RecentLeadsTable';
import { OrdersAwaitingDispatchTable } from '../../components/dashboard/OrdersAwaitingDispatchTable';

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

  const loadData = async () => {
    const [kpiData, distroData, zoneData, leadData, orderData] = await Promise.all([
      dashboardService.getKpis(),
      dashboardService.getBestDistributors(5),
      dashboardService.getZoneMetrics(),
      leadService.getRecent(4),
      orderService.getAwaitingDispatch(4),
    ]);

    setKpis(kpiData);
    setBestDistributors(distroData);
    setZones(zoneData);
    setRecentLeads(leadData);
    setAwaitingOrders(orderData);
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
