import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, RefreshCw, Loader2, Users } from 'lucide-react';
import { DistributorsTable } from '../../components/distributors/DistributorsTable';
import { AddDistributorModal } from '../../components/distributors/AddDistributorModal';
import { PaymentProofModal } from '../../components/distributors/PaymentProofModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Skeleton } from '../../components/common/Skeleton';
import { distributorService } from '../../services/distributorService';
import { zoneService } from '../../services/zoneService';
import { useToast } from '../../hooks/useToast';

export const Distributors = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [distributors, setDistributors] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState('all');

  const [modalState, setModalState] = useState({
    isOpen: false,
    distributor: null,
  });

  const [paymentModalState, setPaymentModalState] = useState({
    isOpen: false,
    distributor: null,
  });

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    distributor: null,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [dData, zData] = await Promise.all([
        distributorService.getAll(),
        zoneService.getAll(),
      ]);
      setDistributors(dData || []);
      setZones(zData || []);
    } catch (err) {
      showError('Error Loading Distributors', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('mittigold-order-created', handleUpdate);
    window.addEventListener('mittigold-order-updated', handleUpdate);
    window.addEventListener('mittigold-order-deleted', handleUpdate);
    window.addEventListener('mittigold-distributor-created', handleUpdate);
    window.addEventListener('mittigold-distributor-updated', handleUpdate);
    window.addEventListener('mittigold-payment-created', handleUpdate);
    window.addEventListener('mittigold-payment-deleted', handleUpdate);

    return () => {
      window.removeEventListener('mittigold-order-created', handleUpdate);
      window.removeEventListener('mittigold-order-updated', handleUpdate);
      window.removeEventListener('mittigold-order-deleted', handleUpdate);
      window.removeEventListener('mittigold-distributor-created', handleUpdate);
      window.removeEventListener('mittigold-distributor-updated', handleUpdate);
      window.removeEventListener('mittigold-payment-created', handleUpdate);
      window.removeEventListener('mittigold-payment-deleted', handleUpdate);
    };
  }, []);

  const handleOpenDetails = (distributor) => {
    navigate(`/distributors/${distributor.id}`);
  };

  const handleOpenAdd = () => {
    setModalState({ isOpen: true, distributor: null });
  };

  const handleOpenEdit = (distributor) => {
    setModalState({ isOpen: true, distributor });
  };

  const handleOpenDelete = (distributor) => {
    setDeleteDialog({ isOpen: true, distributor });
  };

  const handleOpenPaymentProof = (distributor) => {
    setPaymentModalState({ isOpen: true, distributor });
  };

  const handleAddDistributor = async (newDistData) => {
    try {
      await distributorService.add(newDistData);
      await loadData();
    } catch (err) {
      showError('Failed to add distributor', err.message);
    }
  };

  const handleUpdateDistributor = async (updatedData, id) => {
    try {
      await distributorService.update(id, updatedData);
      await loadData();
    } catch (err) {
      showError('Failed to update distributor', err.message);
    }
  };

  const handleConfirmPaymentProof = async (distributorId, proofData) => {
    try {
      await distributorService.updatePayment(distributorId, 'paid', proofData);
      showSuccess(
        'Payment Recorded',
        `Payment proof and record saved for ${paymentModalState.distributor?.name || 'distributor'}.`
      );
      await loadData();
    } catch (err) {
      showError('Failed to save payment proof', err.message);
    }
  };

  const handleTogglePayment = async (id, selectedPay) => {
    const newPay = (selectedPay === 'paid' || selectedPay === 'unpaid')
      ? selectedPay
      : (selectedPay === 'paid' ? 'unpaid' : 'paid');

    // Optimistic UI update
    setDistributors((prev) =>
      prev.map((d) => (d.id === id ? { ...d, pay: newPay } : d))
    );

    try {
      await distributorService.updatePayment(id, newPay);
      showSuccess(
        newPay === 'paid' ? 'Payment Cleared' : 'Marked Unpaid',
        `Payment status updated to ${newPay.toUpperCase()}.`
      );
      await loadData();
    } catch (err) {
      showError('Update Failed', err.message);
      loadData();
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.distributor?.id) return;
    try {
      await distributorService.delete(deleteDialog.distributor.id);
      showSuccess(
        'Distributor Removed',
        `${deleteDialog.distributor.name} was removed from the directory.`
      );
      setDeleteDialog({ isOpen: false, distributor: null });
      await loadData();
    } catch (err) {
      showError('Delete Failed', err.message);
    }
  };

  // Filtered list
  const filteredDistributors = useMemo(() => {
    return distributors.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (d.name || '').toLowerCase().includes(q) ||
        (d.city || '').toLowerCase().includes(q) ||
        (d.area || '').toLowerCase().includes(q) ||
        (d.zone || '').toLowerCase().includes(q) ||
        (d.phone || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (selectedZone !== 'all' && d.zone !== selectedZone) return false;
      if (selectedPayment !== 'all' && d.pay !== selectedPayment) return false;

      return true;
    });
  }, [distributors, searchQuery, selectedZone, selectedPayment]);

  return (
    <div className="panel">
      {/* Panel Header */}
      <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3>Distributor Directory</h3>
          <div className="hint">
            <b>{distributors.length} active</b> · Directory & territory assignment
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAdd}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Distributor</span>
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={loadData}
            title="Refresh list"
            style={{ padding: '7px 9px' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          padding: '14px 18px 10px',
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
            minWidth: '260px',
            maxWidth: '360px',
            flex: '1 1 260px',
          }}
        >
          <Search className="w-4 h-4 text-ink-faint" />
          <input
            type="text"
            placeholder="Search name, city, phone, zone..."
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

        {/* Zone & Payment Filters */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Zone Filter */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '7px',
              border: '1px solid var(--line)',
              fontSize: '12px',
              background: '#FFFFFF',
              color: 'var(--ink)',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Zones</option>
            {zones.map((z) => (
              <option key={z.id || z.name} value={z.name}>
                {z.name}
              </option>
            ))}
          </select>

          {/* Payment Filter */}
          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '7px',
              border: '1px solid var(--line)',
              fontSize: '12px',
              background: '#FFFFFF',
              color: 'var(--ink)',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Payment Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>

          {(searchQuery || selectedZone !== 'all' || selectedPayment !== 'all') && (
            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedZone('all');
                setSelectedPayment('all');
              }}
              style={{ fontSize: '11.5px', padding: '5px 9px' }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table Body */}
      <div className="panel-body" style={{ paddingTop: '6px' }}>
        {loading ? (
          <Skeleton variant="table" rows={6} cols={6} />
        ) : (
          <DistributorsTable
            distributors={filteredDistributors}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
            onViewDetails={handleOpenDetails}
          />
        )}
      </div>

      {/* Add / Edit Modal */}
      <AddDistributorModal
        isOpen={modalState.isOpen}
        distributor={modalState.distributor}
        onClose={() => setModalState({ isOpen: false, distributor: null })}
        zones={zones}
        allDistributors={distributors}
        onAdd={handleAddDistributor}
        onUpdate={handleUpdateDistributor}
      />

      {/* Payment Proof Modal (kept for backward compatibility) */}
      <PaymentProofModal
        isOpen={paymentModalState.isOpen}
        distributor={paymentModalState.distributor}
        onClose={() => setPaymentModalState({ isOpen: false, distributor: null })}
        onConfirmPayment={handleConfirmPaymentProof}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, distributor: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Distributor"
        confirmText="Delete Distributor"
        confirmVariant="danger"
        message={
          deleteDialog.distributor ? (
            <>
              Delete{' '}
              <b style={{ color: 'var(--ink)' }}>{deleteDialog.distributor.name}</b> ({deleteDialog.distributor.city},{' '}
              {deleteDialog.distributor.zone}) from the directory?
            </>
          ) : (
            ''
          )
        }
      />
    </div>
  );
};
