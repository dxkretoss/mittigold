import React from 'react';
import { Edit2, Trash2, Image as ImageIcon, ChevronDown, Upload, Eye } from 'lucide-react';
import { initials } from '../../utils/helpers';
import { GrainGauge } from '../common/GrainGauge';
import { EmptyState } from '../common/EmptyState';
import { Pagination } from '../common/Pagination';
import { usePagination } from '../../hooks/usePagination';

export const DistributorsTable = ({
  distributors = [],
  onEdit,
  onDelete,
  onTogglePayment,
  onOpenPaymentProof,
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

  const handleSelectPaymentChange = (distributor, value) => {
    if (value === 'paid' && distributor.pay !== 'paid') {
      // Open modal to upload payment proof & mark paid
      if (onOpenPaymentProof) {
        onOpenPaymentProof(distributor);
      } else if (onTogglePayment) {
        onTogglePayment(distributor.id, 'paid');
      }
    } else if (value === 'unpaid' && distributor.pay !== 'unpaid') {
      if (onTogglePayment) {
        onTogglePayment(distributor.id, 'unpaid');
      }
    }
  };

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
              <th>Payment Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((d) => {
                const isPaid = d.pay === 'paid';
                const hasProof = !!d.payment_proof;

                return (
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
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {/* Status Select Pill */}
                        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                          <select
                            value={d.pay || 'paid'}
                            onChange={(e) => handleSelectPaymentChange(d, e.target.value)}
                            style={{
                              padding: '4px 22px 4px 8px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              outline: 'none',
                              appearance: 'none',
                              WebkitAppearance: 'none',
                              MozAppearance: 'none',
                              border: isPaid
                                ? '1px solid rgba(61, 122, 92, 0.35)'
                                : '1px solid rgba(178, 72, 58, 0.35)',
                              background: isPaid ? 'var(--green-bg)' : 'var(--red-bg)',
                              color: isPaid ? 'var(--green)' : 'var(--red)',
                              fontFamily: 'inherit',
                            }}
                            title="Click to change payment status"
                          >
                            <option value="paid" style={{ background: '#FFFFFF', color: 'var(--green)' }}>
                              Paid ✓
                            </option>
                            <option value="unpaid" style={{ background: '#FFFFFF', color: 'var(--red)' }}>
                              Unpaid
                            </option>
                          </select>
                          <ChevronDown
                            className="w-3 h-3 pointer-events-none"
                            style={{
                              position: 'absolute',
                              right: '6px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: isPaid ? 'var(--green)' : 'var(--red)',
                              opacity: 0.8,
                            }}
                          />
                        </div>

                        {/* Screenshot / Proof Button */}
                        {isPaid && (
                          hasProof ? (
                            <button
                              type="button"
                              onClick={() => onOpenPaymentProof && onOpenPaymentProof(d)}
                              title="Click to view payment screenshot"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                border: '1px solid rgba(61, 122, 92, 0.4)',
                                background: '#FFFFFF',
                                color: 'var(--green)',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <img
                                src={d.payment_proof}
                                alt="Proof Thumbnail"
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '3px',
                                  objectFit: 'cover',
                                  border: '1px solid rgba(61, 122, 92, 0.3)',
                                }}
                              />
                              <span>View Proof</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOpenPaymentProof && onOpenPaymentProof(d)}
                              title="Upload payment screenshot"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 7px',
                                borderRadius: '6px',
                                border: '1px dashed var(--line)',
                                background: 'transparent',
                                color: 'var(--ink-soft)',
                                fontSize: '11px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <Upload className="w-3 h-3 text-wheat" />
                              <span>+ Upload Proof</span>
                            </button>
                          )
                        )}
                      </div>
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
                );
              })
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
