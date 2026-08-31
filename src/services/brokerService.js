import { initialBrokers } from '../data/brokersData';

let brokersStore = [...initialBrokers];

export const brokerService = {
  async getAll() {
    return [...brokersStore];
  },

  async add(brokerData) {
    const newBroker = {
      id: `broker-${Date.now()}`,
      name: brokerData.name,
      orders: 0,
      commission: "₹0",
      paid: "₹0",
      pending: "₹0",
      ...brokerData
    };
    brokersStore.push(newBroker);
    return newBroker;
  }
};
