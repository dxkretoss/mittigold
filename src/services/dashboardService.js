import { dashboardKpis } from '../data/dashboardData';

export const dashboardService = {
  async getKpis() {
    return [...dashboardKpis];
  }
};
