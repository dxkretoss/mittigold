import React from 'react';
import { ChevronDown, Edit2, Trash2 } from 'lucide-react';
import { initials } from '../../utils/helpers';
import { EmptyState } from '../common/EmptyState';
import { Pagination } from '../common/Pagination';
import { usePagination } from '../../hooks/usePagination';

const STAGE_CONFIG = {
  new: {
    label: 'New',
    bg: 'var(--blue-bg)',
    color: 'var(--blue)',
    border: 'rgba(47, 93, 138, 0.3)',
  },
  followup: {
    label: 'Follow-up',
    bg: 'var(--amber-bg)',
    color: 'var(--amber)',
    border: 'rgba(185, 131, 46, 0.35)',
  },
  convert: {
    label: 'Convert',
    bg: 'var(--green-bg)',
    color: 'var(--green)',
    border: 'rgba(61, 122, 92, 0.35)',
  },
  close: {
    label: 'Close',
    bg: 'var(--red-bg)',
    color: 'var(--red)',
    border: 'rgba(178, 72, 58, 0.3)',
  },
};

export const LeadsTable = ({ leads = [], onStageChange, onEdit, onDelete }) => {
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
              <th>Last Activity</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((l) => {
                const currentStageConfig = STAGE_CONFIG[l.stage] || STAGE_CONFIG.new;

                return (
                  <tr key={l.id || l.name}>
                    <td>
                      <div className="avatarname">
                        <div className="mini-av">{initials(l.name)}</div>
                        <div>
                          <div className="nm">{l.name}</div>
                          {l.phone && (
                            <div className="zoneword" style={{ fontSize: '11px', marginTop: '1px' }}>
                              {l.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="zoneword">{l.zone}</td>
                    <td>
                      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                        <select
                          value={l.stage}
                          onChange={(e) => onStageChange && onStageChange(l, e.target.value)}
                          style={{
                            cursor: 'pointer',
                            outline: 'none',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            padding: '4px 22px 4px 10px',
                            borderRadius: '16px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            fontFamily: 'inherit',
                            background: currentStageConfig.bg,
                            color: currentStageConfig.color,
                            border: `1px solid ${currentStageConfig.border}`,
                            transition: 'all 0.15s ease',
                          }}
                          title="Click to change lead stage"
                        >
                          {Object.entries(STAGE_CONFIG).map(([k, cfg]) => (
                            <option
                              key={k}
                              value={k}
                              style={{ background: '#FFFFFF', color: cfg.color, fontWeight: 600 }}
                            >
                              {cfg.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className="w-3 h-3 pointer-events-none"
                          style={{
                            position: 'absolute',
                            right: '7px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: currentStageConfig.color,
                            opacity: 0.8,
                          }}
                        />
                      </div>
                    </td>
                    <td>{l.owner}</td>
                    <td className="zoneword">{l.last || 'Today'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        {onEdit && (
                          <button
                            type="button"
                            className="icon-sm"
                            onClick={() => onEdit(l)}
                            title="Edit Lead"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            className="icon-sm danger"
                            onClick={() => onDelete(l)}
                            title="Delete Lead"
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
              <EmptyState message="No leads in this stage" colSpan={6} />
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
