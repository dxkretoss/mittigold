import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, RefreshCw, Loader2 } from 'lucide-react';
import { BrokersTable } from '../../components/brokers/BrokersTable';
import { AddBrokerModal } from '../../components/brokers/AddBrokerModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { brokerService } from '../../services/brokerService';
import { useToast } from '../../hooks/useToast';

export const Brokers = () => {
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalState, setModalState] = useState({
    isOpen: false,
    broker: null,
  });
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    broker: null,
  });
  const { showSuccess, showError } = useToast();

  const loadBrokers = async () => {
    try {
      setLoading(true);
      const data = await brokerService.getAll();
      setBrokers(data || []);
    } catch (err) {
      showError('Error Loading Brokers', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrokers();
  }, []);

  const handleOpenAdd = () => {
    setModalState({ isOpen: true, broker: null });
  };

  const handleOpenEdit = (broker) => {
    setModalState({ isOpen: true, broker });
  };

  const handleAddBroker = async (newBrokerData) => {
    try {
      await brokerService.add(newBrokerData);
      loadBrokers();
    } catch (err) {
      showError('Failed to Add Broker', err.message);
    }
  };

  const handleUpdateBroker = async (updatedBrokerData, id) => {
    try {
      await brokerService.update(id, updatedBrokerData);
      loadBrokers();
    } catch (err) {
      showError('Failed to Update Broker', err.message);
    }
  };

  const handleOpenDelete = (broker) => {
    setDeleteDialog({ isOpen: true, broker });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.broker?.id) return;
    try {
      await brokerService.delete(deleteDialog.broker.id);
      showSuccess(
        'Broker Removed',
        `${deleteDialog.broker.name} was removed from the broker directory.`
      );
      setDeleteDialog({ isOpen: false, broker: null });
      loadBrokers();
    } catch (err) {
      showError('Delete Failed', err.message);
    }
  };

  const filteredBrokers = useMemo(() => {
    return brokers.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (b.name || '').toLowerCase().includes(q) ||
        (b.phone || '').toLowerCase().includes(q)
      );
    });
  }, [brokers, searchQuery]);

  return (
    <div className="panel">
      {/* Panel Header */}
      <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3>Broker Performance</h3>
          <div className="hint">
            <b>{brokers.length} active</b> · Commission — paid vs pending, monthly report
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-outline"
            onClick={loadBrokers}
            title="Refresh Brokers"
            style={{ padding: '7px 11px' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleOpenAdd}
          >
            <Plus className="w-3.5 h-3.5" /> Add Broker
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          padding: '14px 18px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--line)',
        }}
      >
        {/* Search */}
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
            placeholder="Search broker name, phone..."
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

      {/* Table Body */}
      <div className="panel-body" style={{ paddingTop: '6px' }}>
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-soft)' }}>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-wheat mb-2" />
            <div style={{ fontSize: '13px' }}>Loading brokers...</div>
          </div>
        ) : (
          <BrokersTable
            brokers={filteredBrokers}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
          />
        )}
      </div>

      <AddBrokerModal
        isOpen={modalState.isOpen}
        broker={modalState.broker}
        onClose={() => setModalState({ isOpen: false, broker: null })}
        onAdd={handleAddBroker}
        onUpdate={handleUpdateBroker}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, broker: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Broker"
        confirmText="Delete Broker"
        confirmVariant="danger"
        message={
          deleteDialog.broker ? (
            <>
              Are you sure you want to delete <b style={{ color: 'var(--ink)' }}>{deleteDialog.broker.name}</b> from the broker network? This action cannot be undone.
            </>
          ) : (
            ''
          )
        }
      />
    </div>
  );
};

