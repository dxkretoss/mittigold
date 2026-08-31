import { initialLeads } from '../data/leadsData';

let leadsStore = [...initialLeads];

export const leadService = {
  async getAll(filter = 'all') {
    if (filter === 'all') return [...leadsStore];
    return leadsStore.filter(l => l.stage === filter);
  },

  async getRecent(limit = 4) {
    return leadsStore.slice(0, limit);
  },

  async updateStage(leadIdOrIndex, newStage) {
    let lead;
    if (typeof leadIdOrIndex === 'number') {
      lead = leadsStore[leadIdOrIndex];
    } else {
      lead = leadsStore.find(l => l.id === leadIdOrIndex);
    }
    
    if (lead) {
      const changed = lead.stage !== newStage;
      lead.stage = newStage;
      lead.last = 'Just now';
      return { lead, changed };
    }
    return { lead: null, changed: false };
  },

  async add(leadData) {
    const newLead = {
      id: `lead-${Date.now()}`,
      stage: 'new',
      last: 'Today',
      ...leadData
    };
    leadsStore.unshift(newLead);
    return newLead;
  }
};
