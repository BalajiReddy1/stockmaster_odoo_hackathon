import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { dashboardAPI } from '@/services/inventoryService';
import { 
  Package, 
  Warehouse,
  MapPin,
  Activity,
  AlertCircle, 
  TrendingUp,
  BarChart3,
  Plus,
  ArrowRight,
  Truck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getMetrics();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchDashboardData} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { overview, warehouses, lowStockItems } = dashboardData || {};

  const StatCard = ({ title, value, icon: Icon, variant = 'blue' }) => {
    const bgClasses = {
      blue: 'bg-blue-100',
      green: 'bg-green-100', 
      red: 'bg-red-100',
      purple: 'bg-purple-100'
    };
    
    const iconClasses = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      red: 'text-red-600', 
      purple: 'text-purple-600'
    };
    
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
            <div className={`h-12 w-12 ${bgClasses[variant]} rounded-lg flex items-center justify-center`}>
              <Icon className={`h-6 w-6 ${iconClasses[variant]}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Here's an overview of your inventory management system.
        </p>
      </div>

      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Package className="mr-2 h-5 w-5 text-blue-600" />
              Total Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {overview?.totalStock?.toLocaleString() || 0}
            </div>
            <p className="text-sm text-gray-600">units across all locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Warehouse className="mr-2 h-5 w-5 text-green-600" />
              Warehouses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {overview?.totalWarehouses || 0}
            </div>
            <p className="text-sm text-gray-600">active facilities</p>
            {overview?.lowStockAlerts > 0 && (
              <Badge variant="destructive" className="mt-2">
                {overview.lowStockAlerts} alerts
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-purple-600" />
              Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {overview?.totalLocations || 0}
            </div>
            <p className="text-sm text-gray-600">storage locations</p>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Products"
          value={overview?.totalProducts?.toLocaleString() || 0}
          icon={Package}
          variant="blue"
        />
        
        <StatCard
          title="Active Warehouses"
          value={overview?.totalWarehouses || 0}
          icon={Warehouse}
          variant="green"
        />
        
        <StatCard
          title="Total Locations"
          value={overview?.totalLocations || 0}
          icon={MapPin}
          variant="purple"
        />
        
        <StatCard
          title="Low Stock Alerts"
          value={overview?.lowStockAlerts || 0}
          icon={AlertCircle}
          variant="red"
        />
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Warehouse Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {warehouses?.length > 0 ? (
              <div className="space-y-4">
                {warehouses.slice(0, 3).map((warehouse) => (
                  <div key={warehouse.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{warehouse.name}</h4>
                      <p className="text-sm text-gray-600">{warehouse.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{warehouse.totalStock.toLocaleString()} units</p>
                      <p className="text-sm text-gray-600">{warehouse.totalProducts} products</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No warehouses found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems?.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.slice(0, 5).map((item, index) => (
                  <div key={`${item.productId}-${item.locationId}-${index}`} className="flex items-center justify-between p-2 border-l-4 border-red-400 bg-red-50">
                    <div>
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-xs text-gray-600">{item.location.warehouse.name} - {item.location.name}</p>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {item.quantity} {item.product.unitOfMeasure}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No low stock alerts</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <Plus className="h-6 w-6" />
              <span className="text-sm">Add Stock</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <ArrowRight className="h-6 w-6" />
              <span className="text-sm">Transfer Stock</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">Stock Adjustment</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col space-y-2">
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">View Reports</span>
            </Button>

            <Button 
              onClick={() => navigate('/delivery')} 
              variant="default" 
              className="h-20 flex flex-col space-y-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <Truck className="h-6 w-6" />
              <span className="text-sm">Delivery Ops</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;