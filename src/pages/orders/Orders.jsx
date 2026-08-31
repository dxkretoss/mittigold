import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { OrdersTable } from '../../components/orders/OrdersTable';
import { NewOrderModal } from '../../components/orders/NewOrderModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Skeleton } from '../../components/common/Skeleton';
import { orderService } from '../../services/orderService';
import { useToast } from '../../hooks/useToast';
import { ORDER_STATUS_LABELS } from '../../utils/constants';

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [modalState, setModalState] = useState({
    isOpen: false,
    order: null,
  });
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    order: null,
  });
  const { showSuccess, showError } = useToast();

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getAll('all');
      setOrders(data || []);
    } catch (err) {
      showError('Error Loading Orders', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    const handleOrderEvent = () => {
      loadOrders();
    };

    window.addEventListener('mittigold-order-created', handleOrderEvent);
    window.addEventListener('mittigold-order-updated', handleOrderEvent);
    window.addEventListener('mittigold-order-deleted', handleOrderEvent);

    return () => {
      window.removeEventListener('mittigold-order-created', handleOrderEvent);
      window.removeEventListener('mittigold-order-updated', handleOrderEvent);
      window.removeEventListener('mittigold-order-deleted', handleOrderEvent);
    };
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateStatus(orderId, newStatus);
      await loadOrders();
      const statusText = ORDER_STATUS_LABELS[newStatus] || newStatus;
      showSuccess('Status Updated', `Order ${orderId} marked as ${statusText}.`);
    } catch (err) {
      showError('Status Update Failed', err.message);
    }
  };

  const handleOpenAdd = () => {
    setModalState({ isOpen: true, order: null });
  };

  const handleOpenEdit = (order) => {
    setModalState({ isOpen: true, order });
  };

  const handleOpenDelete = (order) => {
    setDeleteDialog({ isOpen: true, order });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.order?.id) return;
    try {
      await orderService.delete(deleteDialog.order.id);
      showSuccess('Order Deleted', `Order ${deleteDialog.order.id} was deleted.`);
      setDeleteDialog({ isOpen: false, order: null });
      loadOrders();
    } catch (err) {
      showError('Delete Failed', err.message);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'all') return true;
    return o.status === filter;
  });

  return (
    <div className="panel">
      <div className="panel-head" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3>Order Management</h3>
          <div className="hint">
            <b>{orders.length} orders</b> · Admin / Plant Manager access only
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Status Filter Tabs */}
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
              className={`tab ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
            <button
              type="button"
              className={`tab ${filter === 'approved' ? 'active' : ''}`}
              onClick={() => setFilter('approved')}
            >
              Approved
            </button>
            <button
              type="button"
              className={`tab ${filter === 'dispatched' ? 'active' : ''}`}
              onClick={() => setFilter('dispatched')}
            >
              Dispatched
            </button>
            <button
              type="button"
              className={`tab ${filter === 'delivered' ? 'active' : ''}`}
              onClick={() => setFilter('delivered')}
            >
              Delivered
            </button>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={handleOpenAdd}
          >
            <Plus className="w-3.5 h-3.5" /> Add Order
          </button>
        </div>
      </div>

      <div className="panel-body" style={{ paddingTop: '6px' }}>
        {loading ? (
          <Skeleton variant="table" rows={6} cols={6} />
        ) : (
          <OrdersTable
            orders={filteredOrders}
            onStatusChange={handleStatusChange}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
          />
        )}
      </div>

      <NewOrderModal
        isOpen={modalState.isOpen}
        order={modalState.order}
        onClose={() => setModalState({ isOpen: false, order: null })}
        onOrderCreated={loadOrders}
        onOrderUpdated={loadOrders}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, order: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Order"
        confirmText="Delete Order"
        confirmVariant="danger"
        message={
          deleteDialog.order ? (
            <>
              Are you sure you want to delete order <b style={{ color: 'var(--ink)' }}>{deleteDialog.order.id}</b> ({deleteDialog.order.dist})? This action cannot be undone.
            </>
          ) : (
            ''
          )
        }
      />
    </div>
  );
};
