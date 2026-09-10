import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, RefreshCw, Loader2 } from 'lucide-react';
import { InvoiceList } from '../../components/invoices/InvoiceList';
import { InvoiceDocument } from '../../components/invoices/InvoiceDocument';
import { CreateInvoiceModal } from '../../components/invoices/CreateInvoiceModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Skeleton } from '../../components/common/Skeleton';
import { invoiceService } from '../../services/invoiceService';
import { distributorService } from '../../services/distributorService';
import { settingsService } from '../../services/settingsService';
import { useToast } from '../../hooks/useToast';

export const Invoices = () => {
  const { showSuccess, showError, showInfo } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, invoice: null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, invoice: null });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'paid'

  const loadData = async () => {
    try {
      setLoading(true);
      const [invData, distData, stData] = await Promise.all([
        invoiceService.getAll(),
        distributorService.getAll(),
        settingsService.getSettings(),
      ]);
      setInvoices(invData || []);
      setDistributors(distData || []);
      setCompanySettings(stData || null);
      if (invData && invData.length > 0) {
        setSelectedId((prev) => (prev && invData.some((i) => i.id === prev) ? prev : invData[0].id));
      }
    } catch (err) {
      showError('Error Loading Invoices', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (invoiceId, currentStatus) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    // Optimistic UI update
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: newStatus } : inv))
    );

    try {
      await invoiceService.updateStatus(invoiceId, newStatus);
      showSuccess(
        newStatus === 'paid' ? 'Payment Recorded' : 'Marked as Pending',
        `${invoiceId} status updated to ${newStatus.toUpperCase()}.`
      );
    } catch (err) {
      showError('Failed to update status', err.message);
      loadData();
    }
  };

  const handleOpenAdd = () => {
    setModalState({ isOpen: true, invoice: null });
  };

  const handleOpenEdit = (invoice) => {
    setModalState({ isOpen: true, invoice });
  };

  const handleOpenDelete = (invoice) => {
    setDeleteDialog({ isOpen: true, invoice });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.invoice?.id) return;
    try {
      await invoiceService.delete(deleteDialog.invoice.id);
      showSuccess('Invoice Deleted', `${deleteDialog.invoice.id} was permanently removed.`);
      setDeleteDialog({ isOpen: false, invoice: null });
      await loadData();
    } catch (err) {
      showError('Delete Failed', err.message);
    }
  };

  const handleInvoiceSaved = (savedInv) => {
    loadData();
    if (savedInv?.id) {
      setSelectedId(savedInv.id);
    }
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (inv.id || '').toLowerCase().includes(q) ||
        (inv.dist || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (filterStatus === 'paid') return inv.status === 'paid';
      if (filterStatus === 'pending') return inv.status === 'pending';
      return true;
    });
  }, [invoices, searchQuery, filterStatus]);

  const selectedInvoice =
    invoices.find((i) => i.id === selectedId) ||
    filteredInvoices[0] ||
    invoices[0];

  return (
    <div
      className="grid2"
      style={{ gridTemplateColumns: 'minmax(300px, 360px) 1fr', alignItems: 'start', gap: '18px' }}
    >
      {/* Left List Panel */}
      <div className="panel">
        <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Invoices</h3>
            <div className="hint">
              {invoices.length} Total · {invoices.filter((i) => i.status === 'paid').length} Paid
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-outline"
              onClick={loadData}
              title="Refresh Invoices"
              style={{ padding: '6px 9px' }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleOpenAdd}
            >
              <Plus className="w-3.5 h-3.5" /> Create
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{ padding: '12px 14px 6px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FBFAF7',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '5px 9px',
              fontSize: '12.5px',
              marginBottom: '10px',
            }}
          >
            <Search className="w-3.5 h-3.5 text-ink-faint" />
            <input
              type="text"
              placeholder="Search ID or distributor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                width: '100%',
                fontSize: '12px',
                padding: 0,
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'paid', label: 'Paid' },
            ].map((tab) => {
              const active = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatus(tab.id)}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    fontSize: '11.5px',
                    fontWeight: active ? 600 : 500,
                    borderRadius: '6px',
                    border: active ? '1px solid var(--wheat)' : '1px solid transparent',
                    background: active ? 'var(--amber-bg)' : 'transparent',
                    color: active ? 'var(--navy)' : 'var(--ink-soft)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel-body" style={{ padding: '0 12px', paddingTop: '4px', maxHeight: '560px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '8px 4px' }}>
              <Skeleton variant="rect" height="74px" style={{ marginBottom: '8px' }} />
              <Skeleton variant="rect" height="74px" style={{ marginBottom: '8px' }} />
              <Skeleton variant="rect" height="74px" style={{ marginBottom: '8px' }} />
              <Skeleton variant="rect" height="74px" />
            </div>
          ) : (
            <InvoiceList
              invoices={filteredInvoices}
              selectedId={selectedInvoice?.id}
              onSelect={(id) => setSelectedId(id)}
            />
          )}
        </div>
      </div>

      {/* Right Invoice Document */}
      <InvoiceDocument
        invoice={selectedInvoice}
        companySettings={companySettings}
        distributors={distributors}
        onToggleStatus={handleToggleStatus}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      {/* Create / Edit Modal */}
      <CreateInvoiceModal
        isOpen={modalState.isOpen}
        invoice={modalState.invoice}
        onClose={() => setModalState({ isOpen: false, invoice: null })}
        companySettings={companySettings}
        onInvoiceCreated={handleInvoiceSaved}
        onInvoiceUpdated={handleInvoiceSaved}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, invoice: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Invoice"
        confirmText="Delete Invoice"
        confirmVariant="danger"
        message={
          deleteDialog.invoice ? (
            <>
              Are you sure you want to delete invoice{' '}
              <b style={{ color: 'var(--ink)' }}>{deleteDialog.invoice.id}</b> for{' '}
              <b style={{ color: 'var(--ink)' }}>{deleteDialog.invoice.dist}</b>? This action cannot be undone.
            </>
          ) : (
            ''
          )
        }
      />
    </div>
  );
};
