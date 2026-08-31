import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, RefreshCw, Loader2 } from 'lucide-react';
import { LeadsTable } from '../../components/leads/LeadsTable';
import { LeadsKanban } from '../../components/leads/LeadsKanban';
import { AddLeadModal } from '../../components/leads/AddLeadModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Skeleton } from '../../components/common/Skeleton';
import { leadService } from '../../services/leadService';
import { useToast } from '../../hooks/useToast';
import { STAGE_LABELS } from '../../utils/constants';

export const Leads = () => {
  const { showSuccess, showError } = useToast();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('table'); // 'table' or 'kanban'
  const [searchQuery, setSearchQuery] = useState('');

  const [modalState, setModalState] = useState({
    isOpen: false,
    lead: null,
  });

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    lead: null,
  });

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await leadService.getAll('all');
      setLeads(data || []);
    } catch (err) {
      showError('Error Loading Leads', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();

    const handleLeadEvent = () => {
      loadLeads();
    };

    window.addEventListener('mittigold-lead-created', handleLeadEvent);
    window.addEventListener('mittigold-lead-updated', handleLeadEvent);

    return () => {
      window.removeEventListener('mittigold-lead-created', handleLeadEvent);
      window.removeEventListener('mittigold-lead-updated', handleLeadEvent);
    };
  }, []);

  const handleStageChange = async (lead, newStage) => {
    try {
      const { changed } = await leadService.updateStage(lead.id, newStage);
      if (changed) {
        await loadLeads();
        showSuccess(
          'Lead Stage Updated',
          `${lead.name} moved to ${STAGE_LABELS[newStage] || newStage}.`
        );
      }
    } catch (err) {
      showError('Stage Update Failed', err.message);
    }
  };

  const handleOpenAdd = () => {
    setModalState({ isOpen: true, lead: null });
  };

  const handleOpenEdit = (lead) => {
    setModalState({ isOpen: true, lead });
  };

  const handleAddLead = async (newLeadData) => {
    try {
      const created = await leadService.add(newLeadData);
      showSuccess('Lead Added', `${created.name} added to pipeline.`);
      await loadLeads();
    } catch (err) {
      showError('Failed to Add Lead', err.message);
    }
  };

  const handleUpdateLead = async (updatedData, leadId) => {
    try {
      const updated = await leadService.update(leadId, updatedData);
      showSuccess('Lead Updated', `${updated.name} details saved.`);
      await loadLeads();
    } catch (err) {
      showError('Failed to Update Lead', err.message);
    }
  };

  const handleOpenDelete = (lead) => {
    setDeleteDialog({ isOpen: true, lead });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.lead?.id) return;
    try {
      await leadService.delete(deleteDialog.lead.id);
      showSuccess('Lead Deleted', `${deleteDialog.lead.name} was removed from pipeline.`);
      setDeleteDialog({ isOpen: false, lead: null });
      await loadLeads();
    } catch (err) {
      showError('Delete Failed', err.message);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchesStage = filter === 'all' || l.stage === filter;
      if (!matchesStage) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      return (
        (l.name || '').toLowerCase().includes(q) ||
        (l.owner || '').toLowerCase().includes(q) ||
        (l.zone || '').toLowerCase().includes(q) ||
        (l.phone || '').toLowerCase().includes(q)
      );
    });
  }, [leads, filter, searchQuery]);

  return (
    <div className="panel">
      {/* Header */}
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

          {/* Action Buttons */}
          <button
            type="button"
            className="btn-outline"
            onClick={loadLeads}
            title="Refresh Leads"
            style={{ padding: '7px 11px' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={handleOpenAdd}
          >
            <Plus className="w-3.5 h-3.5" /> Add Lead
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div
        style={{
          padding: '12px 18px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FFFFFF',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '13px',
            minWidth: '240px',
          }}
        >
          <Search className="w-4 h-4 text-ink-faint" />
          <input
            type="text"
            placeholder="Search lead, owner, phone, zone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              width: '100%',
              fontSize: '12.5px',
              padding: 0,
            }}
          />
        </div>

        {searchQuery && (
          <button
            type="button"
            className="btn-outline"
            onClick={() => setSearchQuery('')}
            style={{ fontSize: '11.5px', padding: '5px 9px' }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Body */}
      <div className="panel-body" style={{ paddingTop: '6px' }}>
        {loading ? (
          <Skeleton variant="table" rows={6} cols={6} />
        ) : view === 'table' ? (
          <LeadsTable
            leads={filteredLeads}
            onStageChange={handleStageChange}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
          />
        ) : (
          <div style={{ paddingTop: '4px' }}>
            <LeadsKanban
              leads={filteredLeads}
              filter={filter}
              onStageChange={handleStageChange}
            />
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AddLeadModal
        isOpen={modalState.isOpen}
        lead={modalState.lead}
        onClose={() => setModalState({ isOpen: false, lead: null })}
        onAdd={handleAddLead}
        onUpdate={handleUpdateLead}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, lead: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Lead"
        confirmText="Delete Lead"
        confirmVariant="danger"
        message={
          deleteDialog.lead ? (
            <>
              Are you sure you want to delete lead <b style={{ color: 'var(--ink)' }}>{deleteDialog.lead.name}</b>? This action cannot be undone.
            </>
          ) : (
            ''
          )
        }
      />
    </div>
  );
};
