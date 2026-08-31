import { initialDistributors } from '../data/distributorsData';

let distributorsStore = [...initialDistributors];

export const distributorService = {
  async getAll() {
    return [...distributorsStore];
  },

  async getBest(limit = 5) {
    return [...distributorsStore]
      .sort((a, b) => b.target - a.target)
      .slice(0, limit);
  },

  async add(distributorData) {
    const newDist = {
      id: `dist-${Date.now()}`,
      ...distributorData,
      outstanding: distributorData.outstanding || "₹0",
      pay: distributorData.pay || "paid",
    };
    distributorsStore.push(newDist);
    return newDist;
  }
};
