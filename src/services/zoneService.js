import { supabase } from '../lib/supabase';

function parseAmount(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
}

const PREDEFINED_ZONES = [
  { id: 'zone-1', zone_number: 1, name: 'South Gujarat' },
  { id: 'zone-2', zone_number: 2, name: 'North Gujarat' },
  { id: 'zone-3', zone_number: 3, name: 'Central Gujarat' },
  { id: 'zone-4', zone_number: 4, name: 'Saurashtra' },
];

export const zoneService = {
  /**
   * Fetch 4 predefined zones with dynamically extracted cities from registered distributors
   */
  async getAll() {
    try {
      const [
        { data: zonesData, error: zoneError },
        { data: distributors, error: distError },
        { data: invoices, error: invError }
      ] = await Promise.all([
        supabase.from('zones').select('*').order('zone_number', { ascending: true }),
        supabase.from('distributors').select('name, zone, city'),
        supabase.from('invoices').select('dist, amt')
      ]);

      const distList = distributors || [];
      const invList = invoices || [];
      const totalDistributors = distList.length;

      // Map distributors to zone sales from invoices
      const distZoneMap = {};
      distList.forEach((d) => {
        distZoneMap[(d.name || '').trim().toLowerCase()] = (d.zone || '').trim();
      });

      const zoneSalesMap = {};
      invList.forEach((inv) => {
        const zone = distZoneMap[(inv.dist || '').trim().toLowerCase()];
        const amt = parseAmount(inv.amt);
        if (zone) {
          zoneSalesMap[zone] = (zoneSalesMap[zone] || 0) + amt;
        }
      });

      const totalSales = Object.values(zoneSalesMap).reduce((a, b) => a + b, 0);

      // 4 Predefined Zones
      const baseZones = (zonesData && !zoneError && zonesData.length > 0)
        ? zonesData
        : PREDEFINED_ZONES;

      return baseZones.map((z, idx) => {
        const zoneName = z.name;

        // Find all distributors in this zone
        const zoneDistributors = distList.filter(
          (d) => (d.zone || '').trim().toLowerCase() === zoneName.toLowerCase()
        );

        // Dynamically extract cities from actual distributors only (No hardcoded/mock cities)
        const cityCounts = {};
        zoneDistributors.forEach((d) => {
          if (d.city && d.city.trim()) {
            const cityName = d.city.trim();
            cityCounts[cityName] = (cityCounts[cityName] || 0) + 1;
          }
        });

        // Only include cities that actually have registered distributors
        const citiesList = Object.entries(cityCounts).sort(
          (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
        );

        // Compute dynamic percentage share
        let pct = 0;
        if (totalSales > 0 && (zoneSalesMap[zoneName] || 0) > 0) {
          pct = Math.round(((zoneSalesMap[zoneName] || 0) / totalSales) * 100);
        } else if (totalDistributors > 0) {
          pct = Math.round((zoneDistributors.length / totalDistributors) * 100);
        }

        const salesVal = zoneSalesMap[zoneName] || 0;
        const formattedSales = salesVal > 0 ? `₹${salesVal.toLocaleString('en-IN')}` : '₹0';

        return {
          id: z.id || `zone-${idx + 1}`,
          zone_number: z.zone_number || idx + 1,
          name: zoneName,
          totalDistributors: zoneDistributors.length,
          pct,
          sales: formattedSales,
          cities: citiesList,
        };
      });
    } catch (err) {
      console.warn('Failed to calculate dynamic zones:', err);
      return PREDEFINED_ZONES.map(z => ({
        ...z,
        totalDistributors: 0,
        pct: 0,
        sales: '₹0',
        cities: []
      }));
    }
  },
};
