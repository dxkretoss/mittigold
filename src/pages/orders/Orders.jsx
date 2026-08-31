import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { OrdersTable } from '../../components/orders/OrdersTable';
import { NewOrderModal } from '../../components/orders/NewOrderModal';
import { orderService } from '../../services/orderService';

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadOrders = async () => {
    const data = await orderService.getAll('all');
    setOrders(data);
  };

  useEffect(() => {
    loadOrders();

    const handleOrderEvent = () => {
      loadOrders();
    };
    window.addEventListener('mittigold-order-created', handleOrderEvent);
    return () => {
      window.removeEventListener('mittigold-order-created', handleOrderEvent);
    };
  }, []);

  const filteredOrders = orders.filter(
    (o) => filter === 'all' || o.status === filter
  );

  return (
    <div className="panel">
      <div className="panel-head" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3>Order Management</h3>
          <div className="hint">Admin / Plant Manager access only</div>
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
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" /> Add Order
          </button>
        </div>
      </div>

      <div className="panel-body" style={{ paddingTop: '6px' }}>
        <OrdersTable orders={filteredOrders} />
      </div>

      <NewOrderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onOrderCreated={() => {
          loadOrders();
          window.dispatchEvent(new CustomEvent('mittigold-order-created'));
        }}
      />
    </div>
  );
};
