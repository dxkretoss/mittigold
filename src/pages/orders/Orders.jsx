import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { OrdersTable } from '../../components/orders/OrdersTable';
import { NewOrderModal } from '../../components/orders/NewOrderModal';
import { DispatchModal } from '../../components/orders/DispatchModal';
import { OrderDetailsModal } from '../../components/orders/OrderDetailsModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Skeleton } from '../../components/common/Skeleton';
import { orderService } from '../../services/orderService';
import { invoiceService } from '../../services/invoiceService';
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
  const [viewModalState, setViewModalState] = useState({
    isOpen: false,
    order: null,
  });
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    order: null,
  });
  const [dispatchDialog, setDispatchDialog] = useState({
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
    const targetOrder = orders.find((o) => o.id === orderId);

    // Validation: Cannot directly jump from pending/approved to delivered without dispatching first
    if (newStatus === 'delivered' && targetOrder && targetOrder.status !== 'dispatched') {
      showError(
        'Dispatch Required First',
        `Order ${orderId} must be Dispatched before marking as Delivered so that transport details and Tax Invoice are generated.`
      );
      setDispatchDialog({ isOpen: true, order: targetOrder });
      return;
    }

    if (newStatus === 'dispatched') {
      if (targetOrder) {
        setDispatchDialog({ isOpen: true, order: targetOrder });
        return;
      }
    }

    try {
      await orderService.updateStatus(orderId, newStatus);
      await loadOrders();
      const statusText = ORDER_STATUS_LABELS[newStatus] || newStatus;
      showSuccess('Status Updated', `Order ${orderId} marked as ${statusText}.`);
    } catch (err) {
      showError('Status Update Failed', err.message);
    }
  };

  const handleConfirmDispatch = async ({ order, transport, dispatchDate, orderVal, driverName }) => {
    try {
      // 1. Update order status and transport details
      await orderService.update(order.id, {
        dist: order.dist,
        qty: order.qty,
        eta: dispatchDate,
        transport: driverName ? `${transport} (${driverName})` : transport,
        status: 'dispatched',
        items: order.items,
      });

      // 2. Automatically generate and issue tax invoice for the dispatched order
      const structuredItems = Array.isArray(order.items) && order.items.length > 0
        ? order.items.map((it) => {
            const q = parseInt(String(it.qty).replace(/\D/g, ''), 10) || 1;
            const p = it.price || 1000;
            return {
              name: it.name,
              pack: it.pack || '30 kg',
              qty: `${q} bags`,
              price: p,
              amount: p * q,
            };
          })
        : order.items || order.qty;

      const invoicePayload = {
        order_id: order.id,
        dist: order.dist,
        amt: orderVal,
        date: dispatchDate,
        items: structuredItems,
        status: 'pending',
        gstRate: 5,
      };

      const createdInvoice = await invoiceService.add(invoicePayload);

      // 3. Dispatch events and reload
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mittigold-invoice-created'));
      }
      await loadOrders();

      showSuccess(
        'Order Dispatched & Invoice Created',
        `Order ${order.id} dispatched via ${transport}. Tax Invoice ${createdInvoice.id || ''} (${orderVal}) generated automatically.`
      );
    } catch (err) {
      showError('Dispatch Failed', err.message);
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
            onView={(o) => setViewModalState({ isOpen: true, order: o })}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
          />
        )}
      </div>

      <OrderDetailsModal
        isOpen={viewModalState.isOpen}
        order={viewModalState.order}
        onClose={() => setViewModalState({ isOpen: false, order: null })}
        onEdit={(o) => {
          setViewModalState({ isOpen: false, order: null });
          handleOpenEdit(o);
        }}
        onDispatch={(o) => {
          setViewModalState({ isOpen: false, order: null });
          setDispatchDialog({ isOpen: true, order: o });
        }}
      />

      <NewOrderModal
        isOpen={modalState.isOpen}
        order={modalState.order}
        onClose={() => setModalState({ isOpen: false, order: null })}
        onOrderCreated={loadOrders}
        onOrderUpdated={loadOrders}
      />

      <DispatchModal
        isOpen={dispatchDialog.isOpen}
        order={dispatchDialog.order}
        onClose={() => setDispatchDialog({ isOpen: false, order: null })}
        onConfirmDispatch={handleConfirmDispatch}
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
