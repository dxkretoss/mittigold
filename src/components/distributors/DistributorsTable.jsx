import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { initials } from '../../utils/helpers';
import { GrainGauge } from '../common/GrainGauge';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { Pagination } from '../common/Pagination';
import { usePagination } from '../../hooks/usePagination';

export const DistributorsTable = ({
  distributors = [],
  onEdit,
  onDelete,
  onTogglePayment,
}) => {
  const {
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    paginatedData,
    goToPage,
    canPrev,
    canNext,
  } = usePagination(distributors, 10);

  return (
    <div>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Distributor</th>
              <th>Zone / City / Area</th>
              <th>Target Achievement</th>
              <th>Outstanding</th>
              <th>Payment</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((d) => (
                <tr key={d.id || d.name}>
                  <td>
                    <div className="avatarname">
                      <div className="mini-av">{initials(d.name)}</div>
                      <div>
                        <div className="nm">{d.name}</div>
                        {d.phone && (
                          <div style={{ fontSize: '11.5px', color: 'var(--ink-faint)', marginTop: '2px' }}>
                            {d.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="zoneword">
                    {d.zone} <span style={{ color: 'var(--ink-faint)' }}>›</span> {d.city}{' '}
                    <span style={{ color: 'var(--ink-faint)' }}>›</span> {d.area}
                  </td>
                  <td style={{ minWidth: '170px' }}>
                    <GrainGauge
                      percent={d.target}
                      color={d.target >= 100 ? 'green' : ''}
                      showPercent={true}
                    />
                  </td>
                  <td className="amt">{d.outstanding}</td>
                  <td>
                    <select
                      value={d.pay || 'paid'}
                      onChange={(e) => onTogglePayment && onTogglePayment(d.id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        outline: 'none',
                        border: d.pay === 'paid' ? '1px solid rgba(61, 122, 92, 0.35)' : '1px solid rgba(178, 72, 58, 0.35)',
                        background: d.pay === 'paid' ? 'var(--green-bg)' : 'var(--red-bg)',
                        color: d.pay === 'paid' ? 'var(--green)' : 'var(--red)',
                        display: 'inline-block',
                        fontFamily: 'inherit',
                      }}
                    >
                      <option value="paid" style={{ background: '#FFFFFF', color: 'var(--green)' }}>
                        Paid ✓
                      </option>
                      <option value="unpaid" style={{ background: '#FFFFFF', color: 'var(--red)' }}>
                        Unpaid
                      </option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      {onEdit && (
                        <button
                          type="button"
                          className="icon-sm"
                          onClick={() => onEdit(d)}
                          title="Edit Distributor"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          className="icon-sm danger"
                          onClick={() => onDelete(d)}
                          title="Delete Distributor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyState message="No distributors found matching filters" colSpan={6} />
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={goToPage}
        canPrev={canPrev}
        canNext={canNext}
      />
    </div>
  );
};
