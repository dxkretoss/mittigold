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
      distributorService.getBest(5),
      zoneService.getAll(),
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

    const handleOrderEvent = () => {
      loadData();
    };
    window.addEventListener('mittigold-order-created', handleOrderEvent);
    return () => {
      window.removeEventListener('mittigold-order-created', handleOrderEvent);
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
