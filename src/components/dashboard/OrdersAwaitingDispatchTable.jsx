import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../common/Badge';

export const OrdersAwaitingDispatchTable = ({ orders = [] }) => {
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h3>Orders Awaiting Dispatch</h3>
          <div className="hint">Admin / Plant Manager queue</div>
        </div>
        <Link to="/orders" className="link-all">
          View all →
        </Link>
      </div>
      <div className="panel-body" style={{ paddingTop: '6px' }}>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Distributor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="mono">{o.id}</td>
                  <td className="zoneword">{o.dist}</td>
                  <td>
                    <Badge type="order" variant={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
