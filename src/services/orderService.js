import { initialOrders } from '../data/ordersData';
import { pad4 } from '../utils/helpers';

let ordersStore = [...initialOrders];

export const orderService = {
  async getAll(filter = 'all') {
    if (filter === 'all') return [...ordersStore];
    return ordersStore.filter(o => o.status === filter);
  },

  async getAwaitingDispatch(limit = 4) {
    return ordersStore.filter(o => o.status !== 'delivered').slice(0, limit);
  },

  async getPendingCount() {
    return ordersStore.filter(o => o.status !== 'delivered').length;
  },

  getNextId() {
    const nums = ordersStore.map(o => parseInt(o.id.split('-').pop()) || 0);
    return 'MG-2026-' + pad4(nums.reduce((m, n) => Math.max(m, n), 0) + 1);
  },

  async add(orderData) {
    const newOrder = {
      id: orderData.id || this.getNextId(),
      ...orderData,
      status: orderData.status || 'pending'
    };
    ordersStore.unshift(newOrder);
    return newOrder;
  }
};
