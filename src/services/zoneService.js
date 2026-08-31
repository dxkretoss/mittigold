import { initialZones } from '../data/zonesData';

let zonesStore = [...initialZones];

export const zoneService = {
  async getAll() {
    return [...zonesStore];
  }
};
