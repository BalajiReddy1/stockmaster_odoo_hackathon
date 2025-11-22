import api from './api';

// ========================================
// WAREHOUSE API
// ========================================

export const warehouseAPI = {
  getAll: () => api.get('/inventory/warehouses'),
  getById: (id) => api.get(`/inventory/warehouses/${id}`),
  create: (data) => api.post('/inventory/warehouses', data),
  update: (id, data) => api.put(`/inventory/warehouses/${id}`, data),
  delete: (id) => api.delete(`/inventory/warehouses/${id}`),
};

// ========================================
// LOCATION API
// ========================================

export const locationAPI = {
  getAll: (warehouseId = null) => {
    const params = warehouseId ? { warehouseId } : {};
    return api.get('/inventory/locations', { params });
  },
  create: (data) => api.post('/inventory/locations', data),
  update: (id, data) => api.put(`/inventory/locations/${id}`, data),
  delete: (id) => api.delete(`/inventory/locations/${id}`),
};

// ========================================
// STOCK API
// ========================================

export const stockAPI = {
  getOverview: (filters = {}) => api.get('/inventory/stock', { params: filters }),
  getProductStock: (productId) => api.get(`/inventory/stock/product/${productId}`),
  adjustStock: (data) => api.post('/inventory/stock/adjust', data),
  transferStock: (data) => api.post('/inventory/stock/transfer', data),
  receiveStock: (data) => api.post('/inventory/stock/receive', data),
};

// ========================================
// DASHBOARD METRICS API
// ========================================

export const dashboardAPI = {
  getMetrics: async () => {
    try {
      // Fetch all required data in parallel
      const [warehousesRes, stockOverviewRes, lowStockRes] = await Promise.all([
        warehouseAPI.getAll(),
        stockAPI.getOverview(),
        stockAPI.getOverview({ lowStock: 'true' })
      ]);

      const warehouses = warehousesRes.data.data;
      const stockData = stockOverviewRes.data.data;
      const lowStockData = lowStockRes.data.data;

      // Calculate metrics
      const totalWarehouses = warehouses.length;
      const totalLocations = stockData.statistics.totalLocations;
      const totalProducts = stockData.statistics.totalProducts;
      const totalStock = stockData.statistics.totalStock;
      const lowStockAlerts = lowStockData.stockLocations.length;

      // Calculate warehouse utilization (simplified)
      const warehouseStats = warehouses.map(warehouse => ({
        id: warehouse.id,
        name: warehouse.name,
        code: warehouse.code,
        totalStock: warehouse.stats.totalStock,
        totalProducts: warehouse.stats.totalProducts,
        totalLocations: warehouse.stats.totalLocations,
        utilization: Math.min(100, (warehouse.stats.totalStock / 1000) * 100) // Simplified calculation
      }));

      // Recent stock movements (using stock locations as proxy)
      const recentMovements = stockData.stockLocations.slice(0, 5).map(stock => ({
        id: stock.id || Math.random(),
        productName: stock.product.name,
        productSku: stock.product.sku,
        locationName: stock.location.name,
        warehouseName: stock.location.warehouse.name,
        quantity: stock.quantity,
        type: 'Current Stock' // Simplified since we don't have actual movements yet
      }));

      return {
        success: true,
        data: {
          overview: {
            totalWarehouses,
            totalLocations,
            totalProducts,
            totalStock,
            lowStockAlerts
          },
          warehouses: warehouseStats,
          recentMovements,
          lowStockItems: lowStockData.stockLocations.slice(0, 10)
        }
      };
    } catch (error) {
      console.error('Dashboard metrics error:', error);
      throw error;
    }
  }
};

export default api;