import { supabase } from '../lib/supabase';
import { distributorService } from './distributorService';
import { orderService } from './orderService';
import { invoiceService } from './invoiceService';
import { productService } from './productService';

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

function calculateOrderValue(order, productPriceMap) {
  let parsedItems = order?.items;
  if (typeof parsedItems === 'string') {
    try {
      parsedItems = JSON.parse(parsedItems);
    } catch (_) {
      parsedItems = null;
    }
  }

  if (parsedItems && Array.isArray(parsedItems) && parsedItems.length > 0) {
    const total = parsedItems.reduce((sum, item) => {
      const prodName = (item.name || '').trim().toLowerCase();
      const packName = (item.pack || '').trim().toLowerCase();
      const key = `${prodName}_${packName}`;
      
      let unitPrice = productPriceMap[key];
      if (!unitPrice) {
        if (packName.includes('30') || prodName.includes('30')) unitPrice = 1300;
        else if (packName.includes('10') || prodName.includes('10')) unitPrice = 480;
        else if (packName.includes('7') || prodName.includes('7')) unitPrice = 336;
        else if (packName.includes('5') || prodName.includes('5')) unitPrice = 240;
        else unitPrice = 500;
      }
      
      const q = parseInt(item.qty, 10) || 1;
      return sum + (unitPrice * q);
    }, 0);

    if (total > 0) return total;
  }

  if (typeof order?.qty === 'string') {
    const parts = order.qty.split(',');
    let total = 0;
    parts.forEach((part) => {
      const match = part.match(/(\d+)\s*bags?(?:\s*·\s*([^()]+)\s*\(([^)]+)\))?/i);
      if (match) {
        const qtyNum = parseInt(match[1], 10) || 1;
        const prodName = (match[2] || '').trim().toLowerCase();
        const packName = (match[3] || '').trim().toLowerCase();
        const key = `${prodName}_${packName}`;
        let unitPrice = productPriceMap[key];
        if (!unitPrice) {
          if (packName.includes('30') || prodName.includes('30')) unitPrice = 1300;
          else if (packName.includes('10') || prodName.includes('10')) unitPrice = 480;
          else if (packName.includes('7') || prodName.includes('7')) unitPrice = 336;
          else if (packName.includes('5') || prodName.includes('5')) unitPrice = 240;
          else unitPrice = 500;
        }
        total += unitPrice * qtyNum;
      } else {
        const numOnly = parseInt(order.qty.replace(/[^0-9]/g, ''), 10) || 10;
        total += numOnly * 480;
      }
    });
    return total > 0 ? total : 4800;
  }

  return 4800;
}

export const zoneService = {
  /**
   * Fetch 4 predefined zones with dynamically extracted cities and live calculated distributor sales
   */
  async getAll() {
    let distList = [];
    let invList = [];
    let ordList = [];
    let prodList = [];
    let zonesData = [];

    try {
      distList = (await distributorService.getAll()) || [];
    } catch (_) {
      distList = [];
    }

    try {
      invList = (await invoiceService.getAll()) || [];
    } catch (_) {
      invList = [];
    }

    try {
      ordList = (await orderService.getAll('all')) || [];
    } catch (_) {
      ordList = [];
    }

    try {
      prodList = (await productService.getAll()) || [];
    } catch (_) {
      prodList = [];
    }

    try {
      const res = await supabase.from('zones').select('*').order('zone_number', { ascending: true });
      if (res.data && res.data.length > 0) {
        zonesData = res.data;
      }
    } catch (_) {}

    // Build product price lookup map
    const productPriceMap = {};
    prodList.forEach((p) => {
      const prodName = (p.name || '').trim().toLowerCase();
      const packName = (p.pack || '').trim().toLowerCase();
      const key = `${prodName}_${packName}`;
      productPriceMap[key] = parseAmount(p.price) || 500;
    });

    // Map distributors to zone
    const distZoneMap = {};
    distList.forEach((d) => {
      const cleanName = (d.name || '').trim().toLowerCase();
      if (cleanName) {
        distZoneMap[cleanName] = (d.zone || '').trim();
      }
    });

    // Calculate total sales per distributor (invoices + orders)
    const distSalesMap = {};
    distList.forEach((d) => {
      const distName = (d.name || '').trim().toLowerCase();
      if (!distName) return;

      // 1. Invoices total
      const distInvoices = invList.filter(
        (inv) => (inv.dist || '').trim().toLowerCase() === distName
      );
      const invoiceTotal = distInvoices.reduce((sum, inv) => sum + parseAmount(inv.amt), 0);

      // 2. Orders total
      const distOrders = ordList.filter(
        (o) => (o.dist || '').trim().toLowerCase() === distName
      );
      const orderTotal = distOrders.reduce((sum, o) => sum + calculateOrderValue(o, productPriceMap), 0);

      distSalesMap[distName] = invoiceTotal > 0 ? Math.max(invoiceTotal, orderTotal) : orderTotal;
    });

    // Account for any orders with distributor name variations
    ordList.forEach((o) => {
      const orderDistName = (o.dist || '').trim().toLowerCase();
      if (orderDistName && !distSalesMap[orderDistName]) {
        const matchedDist = distList.find(
          (d) => (d.name || '').trim().toLowerCase() === orderDistName
        );
        if (matchedDist) {
          const val = calculateOrderValue(o, productPriceMap);
          distSalesMap[orderDistName] = (distSalesMap[orderDistName] || 0) + val;
          distZoneMap[orderDistName] = matchedDist.zone;
        }
      }
    });

    const zoneSalesMap = {
      'South Gujarat': 0,
      'North Gujarat': 0,
      'Central Gujarat': 0,
      'Saurashtra': 0,
    };

    distList.forEach((d) => {
      const distName = (d.name || '').trim().toLowerCase();
      const zone = (d.zone || '').trim();
      const sales = distSalesMap[distName] || 0;
      if (zone && zoneSalesMap[zone] !== undefined) {
        zoneSalesMap[zone] += sales;
      }
    });

    const totalSales = Object.values(zoneSalesMap).reduce((a, b) => a + b, 0);

    // 4 Predefined Zones
    const baseZones = (zonesData && zonesData.length > 0)
      ? zonesData
      : PREDEFINED_ZONES;

    return baseZones.map((z, idx) => {
      const zoneName = z.name;

      // Find all distributors in this zone
      const zoneDistributors = distList.filter(
        (d) => (d.zone || '').trim().toLowerCase() === zoneName.toLowerCase()
      );

      // Dynamically extract cities from actual distributors only
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

      // Percentage of total sales
      const salesVal = zoneSalesMap[zoneName] || 0;
      const pct = totalSales > 0 ? Math.round((salesVal / totalSales) * 100) : 0;
      const formattedSales = salesVal > 0 ? `₹${salesVal.toLocaleString('en-IN')}` : '₹0';

      return {
        id: z.id || `zone-${idx + 1}`,
        zone_number: z.zone_number || idx + 1,
        name: zoneName,
        totalDistributors: zoneDistributors.length,
        pct,
        sales: formattedSales,
        salesVal,
        cities: citiesList,
      };
    });
  },
};
