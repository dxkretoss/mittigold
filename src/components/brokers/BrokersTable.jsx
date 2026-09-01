import React from 'react';
import { Edit2, Trash2, Eye } from 'lucide-react';
import { initials } from '../../utils/helpers';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { Pagination } from '../common/Pagination';
import { usePagination } from '../../hooks/usePagination';

export const BrokersTable = ({ brokers = [], onView, onEdit, onDelete }) => {
  const {
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    paginatedData,
    goToPage,
    canPrev,
    canNext,
  } = usePagination(brokers, 10);

  return (
    <div>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Broker</th>
              <th>Total Orders</th>
              <th>Commission Earned</th>
              <th>Paid / Pending</th>
              <th style={{ width: '135px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((b) => (
                <tr key={b.id || b.name}>
                  <td>
                    <div
                      className="avatarname"
                      style={{ cursor: onView ? 'pointer' : 'default' }}
                      onClick={() => onView && onView(b)}
                      title="Click to view broker 360 profile, sourced orders and payout receipts"
                    >
                      <div className="mini-av">{initials(b.name)}</div>
                      <div>
                        <div className="nm" style={{ fontWeight: 600, color: 'var(--navy)' }}>
                          {b.name}
                        </div>
                        {b.phone && (
                          <div className="zoneword" style={{ fontSize: '11px', marginTop: '1px' }}>
                            {b.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{b.orders}</div>
                    {b.rate !== undefined && (
                      <div className="zoneword" style={{ fontSize: '11px' }}>
                        {b.rate}% rate
                      </div>
                    )}
                  </td>
                  <td className="amt">{b.commission}</td>
                  <td>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="chip paid">Paid {b.paid}</span>
                      {b.pending && b.pending !== '₹0' && (
                        <span className="chip unpaid">Pending {b.pending}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                      {onView && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => onView(b)}
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
                          title="View Sourced Orders & Payment Receipts"
                        >
                          <Eye className="w-3.5 h-3.5 text-wheat" />
                          <span>View</span>
                        </button>
                      )}
                      {onEdit && (
                        <button
                          type="button"
                          className="icon-sm"
                          onClick={() => onEdit(b)}
                          title="Edit Broker"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          className="icon-sm danger"
                          onClick={() => onDelete(b)}
                          title="Delete Broker"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyState message="No brokers found" colSpan={5} />
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

