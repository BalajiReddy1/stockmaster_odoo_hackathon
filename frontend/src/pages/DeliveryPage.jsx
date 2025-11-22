import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  List, 
  LayoutGrid,
  PackageCheck,
  PackageOpen,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/services/api';

const DeliveryPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);

  // Form state for new delivery
  const [newDelivery, setNewDelivery] = useState({
    customerId: '',
    locationId: '',
    scheduledDate: '',
    notes: '',
    lines: [{ productId: '', quantity: '' }]
  });

  // Status configuration
  const statusConfig = {
    DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Clock },
    WAITING: { label: 'Waiting', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
    READY: { label: 'Ready', color: 'bg-blue-100 text-blue-800', icon: PackageOpen },
    DONE: { label: 'Done', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    CANCELED: { label: 'Canceled', color: 'bg-red-100 text-red-800', icon: AlertCircle }
  };

  // Fetch deliveries
  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/deliveries');
      setDeliveries(response.data);
    } catch (error) {
      toast.error('Failed to fetch deliveries');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reference data
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

  useEffect(() => {
    fetchDeliveries();
    fetchReferenceData();
  }, []);

  // Filter deliveries
  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = 
      delivery.deliveryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.customer?.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group deliveries by status for kanban view
  const groupedDeliveries = {
    DRAFT: filteredDeliveries.filter(d => d.status === 'DRAFT'),
    WAITING: filteredDeliveries.filter(d => d.status === 'WAITING'),
    READY: filteredDeliveries.filter(d => d.status === 'READY'),
    DONE: filteredDeliveries.filter(d => d.status === 'DONE'),
  };

  // Handle create delivery
  const handleCreateDelivery = async () => {
    try {
      await api.post('/deliveries', newDelivery);
      toast.success('Delivery order created successfully');
      setIsCreateModalOpen(false);
      fetchDeliveries();
      // Reset form
      setNewDelivery({
        customerId: '',
        locationId: '',
        scheduledDate: '',
        notes: '',
        lines: [{ productId: '', quantity: '' }]
      });
    } catch (error) {
      toast.error('Failed to create delivery order');
      console.error(error);
    }
  };

  // Handle update delivery status
  const handleUpdateStatus = async (deliveryId, newStatus) => {
    try {
      await api.patch(`/deliveries/${deliveryId}/status`, { status: newStatus });
      toast.success(`Delivery ${newStatus.toLowerCase()} successfully`);
      fetchDeliveries();
    } catch (error) {
      toast.error('Failed to update delivery status');
      console.error(error);
    }
  };

  // Handle pick items
  const handlePickItems = async (deliveryId) => {
    try {
      await api.post(`/deliveries/${deliveryId}/pick`);
      toast.success('Items picked successfully');
      fetchDeliveries();
    } catch (error) {
      toast.error('Failed to pick items');
      console.error(error);
    }
  };

  // Handle pack items
  const handlePackItems = async (deliveryId) => {
    try {
      await api.post(`/deliveries/${deliveryId}/pack`);
      toast.success('Items packed successfully');
      fetchDeliveries();
    } catch (error) {
      toast.error('Failed to pack items');
      console.error(error);
    }
  };

  // Handle validate delivery (reduces stock)
  const handleValidateDelivery = async (deliveryId) => {
    try {
      await api.post(`/deliveries/${deliveryId}/validate`);
      toast.success('Delivery validated - stock reduced automatically');
      fetchDeliveries();
    } catch (error) {
      toast.error('Failed to validate delivery');
      console.error(error);
    }
  };

  // Handle delete delivery
  const handleDeleteDelivery = async (deliveryId) => {
    if (window.confirm('Are you sure you want to delete this delivery?')) {
      try {
        await api.delete(`/deliveries/${deliveryId}`);
        toast.success('Delivery deleted successfully');
        fetchDeliveries();
      } catch (error) {
        toast.error('Failed to delete delivery');
        console.error(error);
      }
    }
  };

  // Add delivery line
  const addDeliveryLine = () => {
    setNewDelivery({
      ...newDelivery,
      lines: [...newDelivery.lines, { productId: '', quantity: '' }]
    });
  };

  // Remove delivery line
  const removeDeliveryLine = (index) => {
    const updatedLines = newDelivery.lines.filter((_, i) => i !== index);
    setNewDelivery({ ...newDelivery, lines: updatedLines });
  };

  // Update delivery line
  const updateDeliveryLine = (index, field, value) => {
    const updatedLines = [...newDelivery.lines];
    updatedLines[index][field] = value;
    setNewDelivery({ ...newDelivery, lines: updatedLines });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render Kanban View
  const renderKanbanView = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Object.entries(groupedDeliveries).map(([status, items]) => {
        const StatusIcon = statusConfig[status].icon;
        return (
          <div key={status} className="flex flex-col">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className="h-4 w-4" />
                <h3 className="font-semibold">{statusConfig[status].label}</h3>
                <Badge variant="secondary" className="ml-1">
                  {items.length}
                </Badge>
              </div>
            </div>
            <div className="space-y-3 flex-1">
              {items.map((delivery) => (
                <Card 
                  key={delivery.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/delivery/${delivery.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold">
                          {delivery.deliveryNumber}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {delivery.customer?.name || 'No customer'}
                        </CardDescription>
                      </div>
                      <Truck className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        <span>{delivery.lines?.length || 0} items</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(delivery.scheduledDate)}</span>
                      </div>
                    </div>
                    {delivery.status === 'READY' && (
                      <div className="mt-3 pt-3 border-t">
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleValidateDelivery(delivery.id);
                          }}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Validate
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {items.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No deliveries
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Render List View
  const renderListView = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 border-b border-gray-200">
            <TableHead className="font-semibold text-gray-700 py-4">Reference</TableHead>
            <TableHead className="font-semibold text-gray-700 py-4">From</TableHead>
            <TableHead className="font-semibold text-gray-700 py-4">To</TableHead>
            <TableHead className="font-semibold text-gray-700 py-4">Contact</TableHead>
            <TableHead className="font-semibold text-gray-700 py-4">Scheduled Date</TableHead>
            <TableHead className="font-semibold text-gray-700 py-4">Status</TableHead>
            <TableHead className="font-semibold text-gray-700 py-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDeliveries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-16 text-gray-500">
                No deliveries found
              </TableCell>
            </TableRow>
          ) : (
            filteredDeliveries.map((delivery) => {
              const StatusIcon = statusConfig[delivery.status].icon;
              return (
                <TableRow key={delivery.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium py-4">
                    {delivery.deliveryNumber}
                  </TableCell>
                  <TableCell className="py-4">{delivery.location?.name || 'N/A'}</TableCell>
                  <TableCell className="py-4">{delivery.customer?.name || 'N/A'}</TableCell>
                  <TableCell className="py-4">{delivery.customer?.name || 'Azure Interior'}</TableCell>
                  <TableCell className="py-4">{formatDate(delivery.scheduledDate)}</TableCell>
                  <TableCell className="py-4">
                    <Badge className={statusConfig[delivery.status].color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig[delivery.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => navigate(`/delivery/${delivery.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {delivery.status === 'DRAFT' && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleUpdateStatus(delivery.id, 'WAITING')}
                        >
                          <PackageOpen className="h-4 w-4" />
                        </Button>
                      )}
                      {delivery.status === 'WAITING' && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handlePickItems(delivery.id)}
                        >
                          <PackageCheck className="h-4 w-4" />
                        </Button>
                      )}
                      {delivery.status === 'READY' && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleValidateDelivery(delivery.id)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeleteDelivery(delivery.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="py-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Truck className="h-6 w-6" />
                  Delivery
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  By default land on List View
                </p>
              </div>
              <Button onClick={() => setIsCreateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                NEW
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reference or contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-white rounded-full border-gray-200"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full">
                  <Filter className="h-4 w-4" />
                </Button>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-10 rounded-full border-gray-200">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="WAITING">Waiting</SelectItem>
                    <SelectItem value="READY">Ready</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                    <SelectItem value="CANCELED">Canceled</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="flex gap-1 bg-indigo-600 rounded-full p-1">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="icon-sm"
                    onClick={() => setViewMode('list')}
                    className={viewMode === 'list' ? 'bg-white text-indigo-600 hover:bg-white rounded-full' : 'text-white hover:bg-indigo-700 rounded-full'}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                    size="icon-sm"
                    onClick={() => setViewMode('kanban')}
                    className={viewMode === 'kanban' ? 'bg-white text-indigo-600 hover:bg-white rounded-full' : 'text-white hover:bg-indigo-700 rounded-full'}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {viewMode === 'list' ? renderListView() : renderKanbanView()}
          </>
        )}
      </div>

      {/* Create Delivery Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Delivery Order</DialogTitle>
            <DialogDescription>
              Create a new delivery order for outgoing goods
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select
                  value={newDelivery.customerId}
                  onValueChange={(value) => setNewDelivery({ ...newDelivery, customerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} ({customer.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Source Location *</Label>
                <Select
                  value={newDelivery.locationId}
                  onValueChange={(value) => setNewDelivery({ ...newDelivery, locationId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} ({location.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Scheduled Date</Label>
              <Input
                type="date"
                value={newDelivery.scheduledDate}
                onChange={(e) => setNewDelivery({ ...newDelivery, scheduledDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Delivery Lines *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addDeliveryLine}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Line
                </Button>
              </div>

              <div className="space-y-2">
                {newDelivery.lines.map((line, index) => (
                  <div key={index} className="grid grid-cols-[1fr_120px_40px] gap-2 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">Product</Label>
                      <Select
                        value={line.productId}
                        onValueChange={(value) => updateDeliveryLine(index, 'productId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={line.quantity}
                        onChange={(e) => updateDeliveryLine(index, 'quantity', e.target.value)}
                        min="1"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeDeliveryLine(index)}
                      disabled={newDelivery.lines.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                placeholder="Additional notes..."
                value={newDelivery.notes}
                onChange={(e) => setNewDelivery({ ...newDelivery, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDelivery}>
              Create Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedDelivery && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl">
                      {selectedDelivery.deliveryNumber}
                    </DialogTitle>
                    <DialogDescription>
                      Delivery Order Details
                    </DialogDescription>
                  </div>
                  <Badge className={statusConfig[selectedDelivery.status].color}>
                    {statusConfig[selectedDelivery.status].label}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* General Information */}
                <div>
                  <h3 className="font-semibold mb-3">General Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Customer</Label>
                      <p className="text-sm font-medium">
                        {selectedDelivery.customer?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Source Location</Label>
                      <p className="text-sm font-medium">
                        {selectedDelivery.location?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Scheduled Date</Label>
                      <p className="text-sm font-medium">
                        {formatDate(selectedDelivery.scheduledDate)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Delivered Date</Label>
                      <p className="text-sm font-medium">
                        {formatDate(selectedDelivery.deliveredDate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delivery Lines */}
                <div>
                  <h3 className="font-semibold mb-3">Delivery Lines</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Picked</TableHead>
                        <TableHead>Packed</TableHead>
                        <TableHead>Delivered</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDelivery.lines?.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="font-medium">
                            {line.product?.name || 'N/A'}
                          </TableCell>
                          <TableCell>{line.quantity}</TableCell>
                          <TableCell>{line.picked || 0}</TableCell>
                          <TableCell>{line.packed || 0}</TableCell>
                          <TableCell>{line.delivered || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Notes */}
                {selectedDelivery.notes && (
                  <div>
                    <h3 className="font-semibold mb-2">Notes</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedDelivery.notes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {selectedDelivery.status === 'DRAFT' && (
                    <Button onClick={() => handleUpdateStatus(selectedDelivery.id, 'WAITING')}>
                      <PackageOpen className="h-4 w-4 mr-2" />
                      Mark as Waiting
                    </Button>
                  )}
                  {selectedDelivery.status === 'WAITING' && (
                    <Button onClick={() => handlePickItems(selectedDelivery.id)}>
                      <PackageCheck className="h-4 w-4 mr-2" />
                      Pick Items
                    </Button>
                  )}
                  {selectedDelivery.status === 'WAITING' && (
                    <Button onClick={() => handlePackItems(selectedDelivery.id)} variant="outline">
                      <Package className="h-4 w-4 mr-2" />
                      Pack Items
                    </Button>
                  )}
                  {selectedDelivery.status === 'READY' && (
                    <Button onClick={() => handleValidateDelivery(selectedDelivery.id)}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Validate & Ship
                    </Button>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeliveryPage;
