import React from 'react';
import { Link } from 'react-router-dom';
import { initials } from '../../utils/helpers';
import { Badge } from '../common/Badge';

export const RecentLeadsTable = ({ leads = [] }) => {
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h3>Recent Leads</h3>
          <div className="hint">New &amp; follow-up activity</div>
        </div>
        <Link to="/leads" className="link-all">
          View all →
        </Link>
      </div>
      <div className="panel-body" style={{ paddingTop: '6px' }}>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Lead</th>
                <th>Stage</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id || l.name}>
                  <td>
                    <div className="avatarname">
                      <div className="mini-av">{initials(l.name)}</div>
                      <div className="nm">{l.name}</div>
                    </div>
                  </td>
                  <td>
                    <Badge type="stage" variant={l.stage} />
                  </td>
                  <td className="zoneword">{l.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
