import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { warehouseAPI, locationAPI } from '@/services/inventoryService';
import { 
  Warehouse,
  MapPin, 
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';

const WarehousePage = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await warehouseAPI.getAll();
      if (response.data.success) {
        setWarehouses(response.data.data);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch warehouses:', err);
      setError('Failed to load warehouses');
      // Mock data fallback
      setWarehouses([
        {
          id: '1',
          name: 'Main Warehouse',
          code: 'MW01',
          address: '1000 Storage Way, Distribution City, TX 75001',
          stats: {
            totalStock: 1200,
            totalProducts: 45,
            totalLocations: 6
          }
        },
        {
          id: '2',
          name: 'North Distribution Center',
          code: 'NDC02',
          address: '500 Northern Blvd, Northville, NY 10001',
          stats: {
            totalStock: 800,
            totalProducts: 32,
            totalLocations: 4
          }
        },
        {
          id: '3',
          name: 'West Coast Facility',
          code: 'WCF03',
          address: '2000 Pacific Drive, Los Angeles, CA 90001',
          stats: {
            totalStock: 500,
            totalProducts: 28,
            totalLocations: 4
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredWarehouses = warehouses.filter(warehouse =>
    warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const WarehouseCard = ({ warehouse }) => (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Warehouse className="mr-2 h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">{warehouse.name}</CardTitle>
              <p className="text-sm text-gray-600 font-mono">{warehouse.code}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Address */}
          {warehouse.address && (
            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>{warehouse.address}</p>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-600">
                {warehouse.stats?.totalStock?.toLocaleString() || 0}
              </div>
              <div className="text-xs text-gray-600">Total Stock</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-600">
                {warehouse.stats?.totalProducts || 0}
              </div>
              <div className="text-xs text-gray-600">Products</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded">
              <div className="text-lg font-bold text-purple-600">
                {warehouse.stats?.totalLocations || 0}
              </div>
              <div className="text-xs text-gray-600">Locations</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Package className="h-4 w-4 mr-1" />
              View Stock
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <MapPin className="h-4 w-4 mr-1" />
              Locations
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading warehouses...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouse Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your warehouse facilities and locations
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Warehouse
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded-md">
          <p className="text-yellow-700">{error} - Showing sample data</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search warehouses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{warehouses.length}</div>
            <div className="text-sm text-gray-600">Total Warehouses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {warehouses.reduce((sum, w) => sum + (w.stats?.totalLocations || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Locations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {warehouses.reduce((sum, w) => sum + (w.stats?.totalStock || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Stock Units</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {warehouses.reduce((sum, w) => sum + (w.stats?.totalProducts || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Products</div>
          </CardContent>
        </Card>
      </div>

      {/* Warehouse Grid */}
      {filteredWarehouses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWarehouses.map(warehouse => (
            <WarehouseCard key={warehouse.id} warehouse={warehouse} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Warehouse className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No warehouses found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'No warehouses match your search criteria.' : 'Get started by adding your first warehouse.'}
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Warehouse
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WarehousePage;