import React from 'react';
import { Link } from 'react-router-dom';
import { initials } from '../../utils/helpers';

export const BestDistributorsTable = ({ distributors = [] }) => {
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h3>Top Distributors</h3>
          <div className="hint">Ranked by month-to-date order value</div>
        </div>
        <Link to="/distributors" className="link-all">
          View all →
        </Link>
      </div>
      <div className="panel-body" style={{ paddingTop: '6px' }}>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Distributor</th>
                <th>Zone</th>
                <th>Orders</th>
                <th>Value (MTD)</th>
              </tr>
            </thead>
            <tbody>
              {distributors.length > 0 ? (
                distributors.map((d) => (
                  <tr key={d.id || d.name}>
                    <td>
                      <div className="avatarname">
                        <div className="mini-av">{initials(d.name)}</div>
                        <div>
                          <div className="nm">{d.name}</div>
                          <div className="sub">{d.city}</div>
                        </div>
                      </div>
                    </td>
                    <td className="zoneword">{d.zone}</td>
                    <td>{d.calculatedOrders !== undefined ? d.calculatedOrders : Math.max(1, Math.floor((d.target || 80) / 4))}</td>
                    <td className="amt">
                      {d.formattedValue || `₹${((d.target || 80) * 612).toLocaleString('en-IN')}`}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--ink-soft)' }}>
                    No distributors found in database
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
