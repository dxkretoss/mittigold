import React from 'react';
import { initials } from '../../utils/helpers';
import { GrainGauge } from '../common/GrainGauge';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { Pagination } from '../common/Pagination';
import { usePagination } from '../../hooks/usePagination';

export const DistributorsTable = ({ distributors = [] }) => {
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
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((d) => (
                <tr key={d.id || d.name}>
                  <td>
                    <div className="avatarname">
                      <div className="mini-av">{initials(d.name)}</div>
                      <div className="nm">{d.name}</div>
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
                    <Badge variant={d.pay}>
                      {d.pay === 'paid' ? 'Paid' : 'Unpaid'}
                    </Badge>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyState message="No distributors found" colSpan={5} />
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
