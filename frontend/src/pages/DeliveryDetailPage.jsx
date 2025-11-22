import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Printer,
  X,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/services/api';

const DeliveryDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [delivery, setDelivery] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [responsible, setResponsible] = useState('');
  
  const [formData, setFormData] = useState({
    deliveryAddress: '',
    responsible: '',
    scheduledDate: '',
    operationType: '',
    lines: []
  });

  // Status flow
  const statusFlow = ['Draft', 'Waiting', 'Ready', 'Done'];

  useEffect(() => {
    if (id && id !== 'new') {
      fetchDelivery();
    }
    fetchReferenceData();
  }, [id]);

  const fetchDelivery = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/deliveries/${id}`);
      const deliveryData = response.data;
      setDelivery(deliveryData);
      
      setFormData({
        deliveryAddress: deliveryData.customer?.address || '',
        responsible: deliveryData.user?.name || '',
        scheduledDate: deliveryData.scheduledDate ? new Date(deliveryData.scheduledDate).toISOString().split('T')[0] : '',
        operationType: 'delivery',
        lines: deliveryData.lines?.map(line => ({
          id: line.id,
          productId: line.productId,
          productName: line.product?.name || '',
          productSku: line.product?.sku || '',
          quantity: line.quantity,
          picked: line.picked || 0,
          packed: line.packed || 0,
          delivered: line.delivered || 0
        })) || []
      });
      
      setResponsible(deliveryData.user?.name || '');
    } catch (error) {
      toast.error('Failed to fetch delivery');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [customersRes, locationsRes, productsRes] = await Promise.all([
        api.get('/customers'),
        api.get('/locations'),
        api.get('/products')
      ]);
      setCustomers(customersRes.data);
      setLocations(locationsRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error('Failed to fetch reference data');
      console.error(error);
    }
  };

  const handleAddProduct = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { productId: '', productName: '', quantity: 0 }]
    });
  };

  const handleRemoveProduct = (index) => {
    const newLines = formData.lines.filter((_, i) => i !== index);
    setFormData({ ...formData, lines: newLines });
  };

  const handleProductChange = (index, field, value) => {
    const newLines = [...formData.lines];
    newLines[index][field] = value;
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        newLines[index].productName = product.name;
        newLines[index].productSku = product.sku;
      }
    }
    
    setFormData({ ...formData, lines: newLines });
  };

  const handleValidate = async () => {
    if (!delivery) return;
    
    try {
      await api.post(`/deliveries/${delivery.id}/validate`);
      toast.success('Delivery validated successfully');
      navigate('/delivery');
    } catch (error) {
      toast.error('Failed to validate delivery');
      console.error(error);
    }
  };

  const handlePrint = () => {
    toast.info('Print functionality coming soon');
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this delivery?')) {
      navigate('/delivery');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'WAITING':
        return 'bg-yellow-100 text-yellow-800';
      case 'READY':
        return 'bg-blue-100 text-blue-800';
      case 'DONE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOutOfStock = (line) => {
    // Check if product is out of stock
    const product = products.find(p => p.id === line.productId);
    return product && product.totalAvailable < line.quantity;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="py-5">
            {/* Top Navigation */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/delivery')}
                  className="rounded-lg"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>Dashboard</span>
                  <span>/</span>
                  <span>Operations</span>
                  <span>/</span>
                  <span>Products</span>
                  <span>/</span>
                  <span>Move History</span>
                  <span>/</span>
                  <span className="text-gray-900 font-medium">Settings</span>
                </div>
              </div>
              <Button variant="outline" size="icon" className="rounded-lg">
                <span className="text-lg">👤</span>
              </Button>
            </div>

            {/* Title and Actions */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/delivery')}
                  className="rounded-lg"
                >
                  <span className="text-indigo-600 font-medium">NEW</span>
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">Delivery</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleValidate}
                  disabled={delivery?.status === 'DONE'}
                  className="rounded-lg border-gray-300"
                >
                  Validate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="rounded-lg border-gray-300"
                >
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="rounded-lg border-gray-300"
                >
                  Cancel
                </Button>
              </div>
            </div>

            {/* Status Flow */}
            <div className="flex items-center gap-2">
              {statusFlow.map((status, index) => (
                <React.Fragment key={status}>
                  <Badge
                    className={`px-4 py-1.5 ${
                      delivery?.status?.toUpperCase() === status.toUpperCase()
                        ? getStatusColor(status)
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {status}
                  </Badge>
                  {index < statusFlow.length - 1 && (
                    <span className="text-gray-400">&gt;</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status Info Box */}
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-700 space-y-1">
            <div><strong>Draft:</strong> Initial state</div>
            <div><strong>Waiting:</strong> Waiting for the out of stock product to be in</div>
            <div><strong>Ready:</strong> Ready to deliver/receive</div>
            <div><strong>Done:</strong> Received or delivered</div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-[1400px] mx-auto px-6 pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* Delivery Number */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-red-500 mb-6">
              {delivery?.deliveryNumber || 'WH/OUT/0001'}
            </h2>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              <div>
                <Label className="text-sm text-gray-600 mb-2 block">
                  Delivery Adress
                </Label>
                <Input
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  className="h-9 border-0 border-b border-red-400 rounded-none focus-visible:ring-0 focus-visible:border-red-500"
                  placeholder="Enter delivery address"
                />
              </div>

              <div>
                <Label className="text-sm text-gray-600 mb-2 block">
                  Schedule Date
                </Label>
                <Input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="h-9 border-0 border-b border-red-400 rounded-none focus-visible:ring-0 focus-visible:border-red-500"
                />
              </div>

              <div>
                <Label className="text-sm text-gray-600 mb-2 block">
                  Responsible
                </Label>
                <Input
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                  className="h-9 border-0 border-b border-red-400 rounded-none focus-visible:ring-0 focus-visible:border-red-500"
                  placeholder="Enter responsible person"
                />
              </div>

              <div>
                <Label className="text-sm text-gray-600 mb-2 block">
                  Operation type
                </Label>
                <div className="relative">
                  <Select
                    value={formData.operationType}
                    onValueChange={(value) => setFormData({ ...formData, operationType: value })}
                  >
                    <SelectTrigger className="h-9 border-0 border-b border-red-400 rounded-none focus:ring-0">
                      <SelectValue placeholder="Select operation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delivery">Delivery</SelectItem>
                      <SelectItem value="receipt">Receipt</SelectItem>
                      <SelectItem value="transfer">Internal Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div>
            <h3 className="text-lg font-semibold text-red-500 mb-4">Products</h3>
            
            {/* Products Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-sm font-semibold text-gray-700 px-4 py-3">
                      Product
                    </th>
                    <th className="text-center text-sm font-semibold text-gray-700 px-4 py-3">
                      Quantity
                    </th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.lines.map((line, index) => (
                    <tr 
                      key={index} 
                      className={`border-b border-gray-200 last:border-0 ${
                        isOutOfStock(line) ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isOutOfStock(line) && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <Select
                            value={line.productId}
                            onValueChange={(value) => handleProductChange(index, 'productId', value)}
                          >
                            <SelectTrigger className="border-0 focus:ring-0 h-8">
                              <SelectValue placeholder="Select product">
                                {line.productName && (
                                  <span className="text-red-500">
                                    [{line.productSku}] {line.productName}
                                  </span>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  [{product.sku}] {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          value={line.quantity}
                          onChange={(e) => handleProductChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="h-8 text-center border-gray-300"
                          min="0"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRemoveProduct(index)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-gray-400" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  
                  {/* New Product Row */}
                  <tr className="border-b border-dashed border-gray-300">
                    <td colSpan="3" className="px-4 py-3">
                      <button
                        onClick={handleAddProduct}
                        className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                      >
                        Add New product
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Add Product Link */}
            <div className="mt-3">
              <button
                onClick={handleAddProduct}
                className="text-sm text-red-500 hover:text-red-600 font-medium"
              >
                Add New product
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Info Box */}
      <div className="max-w-[1400px] mx-auto px-6 pb-8">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong>Alert the notification & mark the line red if product is not in stock.</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetailPage;
