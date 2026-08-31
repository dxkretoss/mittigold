import React, { useState, useEffect } from 'react';
import { LeadsTable } from '../../components/leads/LeadsTable';
import { LeadsKanban } from '../../components/leads/LeadsKanban';
import { leadService } from '../../services/leadService';
import { useToast } from '../../hooks/useToast';
import { STAGE_LABELS } from '../../utils/constants';

export const Leads = () => {
  const { showSuccess } = useToast();
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('table'); // 'table' or 'kanban'

  const loadLeads = async () => {
    const data = await leadService.getAll('all');
    setLeads(data);
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleStageChange = async (lead, newStage) => {
    const { changed } = await leadService.updateStage(lead.id, newStage);
    if (changed) {
      loadLeads();
      showSuccess(
        'Lead Updated',
        `${lead.name} moved to ${STAGE_LABELS[newStage]}.`
      );
    }
  };

  const filteredLeads = leads.filter(
    (l) => filter === 'all' || l.stage === filter
  );

  return (
    <div className="panel">
      <div className="panel-head" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3>Leads Pipeline</h3>
          <div className="hint">
            <b>{leads.length} active leads</b> across 4 stages
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Stage Filters */}
          <div className="tabs">
            <button
              type="button"
              className={`tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`tab ${filter === 'new' ? 'active' : ''}`}
              onClick={() => setFilter('new')}
            >
              New
            </button>
            <button
              type="button"
              className={`tab ${filter === 'followup' ? 'active' : ''}`}
              onClick={() => setFilter('followup')}
            >
              Follow-up
            </button>
            <button
              type="button"
              className={`tab ${filter === 'convert' ? 'active' : ''}`}
              onClick={() => setFilter('convert')}
            >
              Convert
            </button>
            <button
              type="button"
              className={`tab ${filter === 'close' ? 'active' : ''}`}
              onClick={() => setFilter('close')}
            >
              Close
            </button>
          </div>

          {/* View Toggle */}
          <div className="tabs">
            <button
              type="button"
              className={`tab ${view === 'table' ? 'active' : ''}`}
              onClick={() => setView('table')}
            >
              Table
            </button>
            <button
              type="button"
              className={`tab ${view === 'kanban' ? 'active' : ''}`}
              onClick={() => setView('kanban')}
            >
              Kanban
            </button>
          </div>
        </div>
      </div>

      <div className="panel-body" style={{ paddingTop: '6px' }}>
        {view === 'table' ? (
          <LeadsTable leads={filteredLeads} />
        ) : (
          <div style={{ paddingTop: '4px' }}>
            <LeadsKanban
              leads={leads}
              filter={filter}
              onStageChange={handleStageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};
