const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation
} = require('../controllers/inventoryController');

const {
  getStockOverview,
  getProductStock,
  adjustStock,
  transferStock,
  receiveStock
} = require('../controllers/stockController');

// Apply authentication middleware to all routes
router.use(authenticate);

// ========================================
// WAREHOUSE ROUTES
// ========================================

// GET /api/inventory/warehouses - Get all warehouses with stats
router.get('/warehouses', getAllWarehouses);

// GET /api/inventory/warehouses/:id - Get specific warehouse
router.get('/warehouses/:id', getWarehouseById);

// POST /api/inventory/warehouses - Create new warehouse
router.post('/warehouses', createWarehouse);

// PUT /api/inventory/warehouses/:id - Update warehouse
router.put('/warehouses/:id', updateWarehouse);

// DELETE /api/inventory/warehouses/:id - Delete warehouse
router.delete('/warehouses/:id', deleteWarehouse);

// ========================================
// LOCATION ROUTES
// ========================================

// GET /api/inventory/locations - Get all locations (optionally filtered by warehouse)
router.get('/locations', getAllLocations);

// POST /api/inventory/locations - Create new location
router.post('/locations', createLocation);

// PUT /api/inventory/locations/:id - Update location
router.put('/locations/:id', updateLocation);

// DELETE /api/inventory/locations/:id - Delete location
router.delete('/locations/:id', deleteLocation);

// ========================================
// STOCK OVERVIEW ROUTES
// ========================================

// GET /api/inventory/stock - Get stock overview
router.get('/stock', getStockOverview);

// GET /api/inventory/stock/product/:productId - Get stock for specific product
router.get('/stock/product/:productId', getProductStock);

// ========================================
// STOCK MANAGEMENT ROUTES
// ========================================

// POST /api/inventory/stock/adjust - Adjust stock (increase/decrease/set)
router.post('/stock/adjust', adjustStock);

// POST /api/inventory/stock/transfer - Transfer stock between locations
router.post('/stock/transfer', transferStock);

// POST /api/inventory/stock/receive - Receive stock from supplier
router.post('/stock/receive', receiveStock);

module.exports = router;