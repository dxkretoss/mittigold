import React from 'react';
import { initials } from '../../utils/helpers';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { Pagination } from '../common/Pagination';
import { usePagination } from '../../hooks/usePagination';

export const LeadsTable = ({ leads = [] }) => {
  const {
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    paginatedData,
    goToPage,
    canPrev,
    canNext,
  } = usePagination(leads, 10);

  return (
    <div>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Lead / Business</th>
              <th>Zone</th>
              <th>Stage</th>
              <th>Owner</th>
              <th>Last Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((l) => (
                <tr key={l.id || l.name}>
                  <td>
                    <div className="avatarname">
                      <div className="mini-av">{initials(l.name)}</div>
                      <div className="nm">{l.name}</div>
                    </div>
                  </td>
                  <td className="zoneword">{l.zone}</td>
                  <td>
                    <Badge type="stage" variant={l.stage} />
                  </td>
                  <td>{l.owner}</td>
                  <td className="zoneword">{l.last}</td>
                </tr>
              ))
            ) : (
              <EmptyState message="No leads in this stage" colSpan={5} />
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
