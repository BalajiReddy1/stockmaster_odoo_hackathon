import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { stockAPI, warehouseAPI } from '@/services/inventoryService';
import { 
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit
} from 'lucide-react';

const StockOverviewPage = () => {
  const [stockData, setStockData] = useState({
    stockLocations: [],
    statistics: {
      totalProducts: 0,
      totalStock: 0,
      lowStockItems: 0,
      totalLocations: 0
    }
  });
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchStockData();
  }, [selectedWarehouse, showLowStockOnly]);

  const fetchInitialData = async () => {
    try {
      const warehouseResponse = await warehouseAPI.getAll();
      if (warehouseResponse.data.success) {
        setWarehouses(warehouseResponse.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch warehouses:', err);
      // Mock data
      setWarehouses([
        { id: '1', name: 'Main Warehouse', code: 'MW01' },
        { id: '2', name: 'North Distribution Center', code: 'NDC02' },
        { id: '3', name: 'West Coast Facility', code: 'WCF03' }
      ]);
    }
  };

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (selectedWarehouse) filters.warehouseId = selectedWarehouse;
      if (showLowStockOnly) filters.lowStock = 'true';

      const response = await stockAPI.getOverview(filters);
      if (response.data.success) {
        setStockData(response.data.data);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch stock data:', err);
      setError('Failed to load stock data');
      // Mock data fallback
      setStockData({
        stockLocations: [
          {
            id: '1',
            quantity: 45,
            product: {
              name: 'Wireless Mouse',
              sku: 'WM-001',
              unitOfMeasure: 'piece',
              reorderLevel: 50
            },
            location: {
              name: 'A-01-01',
              code: 'MW-A-01-01',
              warehouse: { name: 'Main Warehouse', code: 'MW01' }
            }
          },
          {
            id: '2',
            quantity: 89,
            product: {
              name: 'USB-C Cable 6ft',
              sku: 'UC-002',
              unitOfMeasure: 'piece',
              reorderLevel: 100
            },
            location: {
              name: 'A-01-02',
              code: 'MW-A-01-02',
              warehouse: { name: 'Main Warehouse', code: 'MW01' }
            }
          },
          {
            id: '3',
            quantity: 156,
            product: {
              name: 'A4 Copy Paper',
              sku: 'CP-004',
              unitOfMeasure: 'ream',
              reorderLevel: 100
            },
            location: {
              name: 'B-01-01',
              code: 'MW-B-01-01',
              warehouse: { name: 'Main Warehouse', code: 'MW01' }
            }
          }
        ],
        statistics: {
          totalProducts: 10,
          totalStock: 2500,
          lowStockItems: 2,
          totalLocations: 14
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const isLowStock = (stockLocation) => {
    return stockLocation.quantity <= (stockLocation.product.reorderLevel || 0);
  };

  const getStockStatus = (stockLocation) => {
    if (isLowStock(stockLocation)) {
      return { label: 'Low Stock', variant: 'destructive', icon: AlertTriangle };
    } else if (stockLocation.quantity > (stockLocation.product.reorderLevel || 0) * 2) {
      return { label: 'Well Stocked', variant: 'default', icon: TrendingUp };
    } else {
      return { label: 'Normal', variant: 'secondary', icon: Package };
    }
  };

  const filteredStockLocations = stockData.stockLocations.filter(stock =>
    stock.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.location.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StockLocationRow = ({ stockLocation }) => {
    const status = getStockStatus(stockLocation);
    const StatusIcon = status.icon;

    return (
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Product Info */}
          <div>
            <h4 className="font-medium text-gray-900">{stockLocation.product.name}</h4>
            <p className="text-sm text-gray-600">{stockLocation.product.sku}</p>
          </div>

          {/* Location Info */}
          <div>
            <p className="font-medium text-gray-900">{stockLocation.location.warehouse.name}</p>
            <p className="text-sm text-gray-600">{stockLocation.location.name}</p>
          </div>

          {/* Quantity */}
          <div>
            <p className="font-medium text-gray-900">
              {stockLocation.quantity.toLocaleString()} {stockLocation.product.unitOfMeasure}
            </p>
            <p className="text-sm text-gray-600">
              Reorder at: {stockLocation.product.reorderLevel || 0}
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Badge variant={status.variant} className="flex items-center space-x-1">
              <StatusIcon className="h-3 w-3" />
              <span>{status.label}</span>
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Overview</h1>
          <p className="mt-1 text-sm text-gray-600">
            Monitor stock levels across all warehouses and locations
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Button variant="outline" onClick={fetchStockData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded-md">
          <p className="text-yellow-700">{error} - Showing sample data</p>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stockData.statistics.totalProducts}</div>
            <div className="text-sm text-gray-600">Total Products</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stockData.statistics.totalStock.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Stock Units</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stockData.statistics.lowStockItems}</div>
            <div className="text-sm text-gray-600">Low Stock Alerts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stockData.statistics.totalLocations}</div>
            <div className="text-sm text-gray-600">Active Locations</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, SKUs, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Warehouses</option>
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Low Stock Only</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Stock Locations List */}
      {loading ? (
        <Card>
          <CardContent className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p>Loading stock data...</p>
          </CardContent>
        </Card>
      ) : filteredStockLocations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Stock Locations ({filteredStockLocations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredStockLocations.map(stockLocation => (
                <StockLocationRow key={stockLocation.id} stockLocation={stockLocation} />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stock found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedWarehouse || showLowStockOnly ? 
                'No stock matches your current filters.' : 
                'No stock data available.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StockOverviewPage;