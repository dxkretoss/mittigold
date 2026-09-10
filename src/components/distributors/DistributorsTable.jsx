import React from 'react';
import { Edit2, Trash2, Eye } from 'lucide-react';
import { initials } from '../../utils/helpers';
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                            {d.phone && (
                              <div style={{ fontSize: '11.5px', color: 'var(--ink-faint)' }}>
                                {d.phone}
                              </div>
                            )}
                            {d.reference_type && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: d.reference_type === 'broker' ? 'var(--amber-bg)' : d.reference_type === 'employee' ? 'var(--green-bg)' : '#F1EFEA',
                                  color: d.reference_type === 'broker' ? '#886214' : d.reference_type === 'employee' ? 'var(--green)' : 'var(--ink-soft)',
                                  border: '1px solid rgba(0,0,0,0.06)',
                                }}
                              >
                                {d.reference_type === 'company'
                                  ? 'Company Direct'
                                  : `${d.reference_type === 'broker' ? 'Broker' : 'Employee'}: ${d.reference_name || 'Ref'}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="zoneword">
                      {d.zone} <span style={{ color: 'var(--ink-faint)' }}>›</span> {d.city}{' '}
                      <span style={{ color: 'var(--ink-faint)' }}>›</span> {d.area}
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
              <EmptyState message="No distributors found matching filters" colSpan={4} />
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
