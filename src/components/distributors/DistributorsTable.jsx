import React from 'react';
import { Edit2, Trash2, Eye } from 'lucide-react';
import { initials } from '../../utils/helpers';
import { GrainGauge } from '../common/GrainGauge';
import { EmptyState } from '../common/EmptyState';
import { Pagination } from '../common/Pagination';
import { usePagination } from '../../hooks/usePagination';

export const DistributorsTable = ({
  distributors = [],
  onEdit,
  onDelete,
  onViewDetails,
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
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((d) => {
                const rawOutstanding = parseFloat(String(d.outstanding || '').replace(/[^0-9.]/g, '')) || 0;

                return (
                  <tr key={d.id || d.name}>
                    <td>
                      <div
                        className="avatarname"
                        onClick={() => onViewDetails && onViewDetails(d)}
                        style={{ cursor: 'pointer' }}
                        title="Click to view distributor profile & order history"
                      >
                        <div className="mini-av">{initials(d.name)}</div>
                        <div>
                          <div className="nm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{d.name}</span>
                          </div>
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
                    <td style={{ minWidth: '160px' }}>
                      <GrainGauge
                        percent={d.target || 0}
                        color={(d.target || 0) >= 100 ? 'green' : ''}
                        showPercent={true}
                      />
                    </td>
                    <td
                      className="amt"
                      style={{
                        textAlign: 'center',
                        color: rawOutstanding > 0 ? 'var(--red)' : 'var(--ink)',
                        fontWeight: rawOutstanding > 0 ? 700 : 500,
                      }}
                    >
                      {d.outstanding || '₹0'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                        {onViewDetails && (
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => onViewDetails(d)}
                            style={{
                              padding: '4px 10px',
                              fontSize: '11.5px',
                              height: '28px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              borderRadius: '6px',
                              color: 'var(--navy)',
                            }}
                            title="View orders, invoices and payment ledger"
                          >
                            <Eye className="w-3.5 h-3.5 text-wheat" />
                            <span>Details</span>
                          </button>
                        )}
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
                );
              })
            ) : (
              <EmptyState message="No distributors found matching filters" colSpan={5} />
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
