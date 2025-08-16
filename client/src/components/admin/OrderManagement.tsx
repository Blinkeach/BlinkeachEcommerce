import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Search, 
  Eye, 
  FileText,
  ArrowUpDown,
  Upload,
  FileImage 
} from 'lucide-react';
import { ObjectUploader } from '@/components/ObjectUploader';
import type { UploadResult } from '@uppy/core';

interface OrderItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  userId: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  shippingAddress: string;
  paymentMethod: string;
  paymentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  specialInstructions?: string;
  invoiceUrl?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  userName?: string;
  userEmail?: string;
  userPhone?: string;
}

const OrderManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch orders
  const { data: allOrders, isLoading, error } = useQuery({
    queryKey: ['/api/orders'],
    suspense: false
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const response = await apiRequest('PUT', `/api/orders/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: 'Status updated',
        description: 'The order status has been successfully updated.',
        duration: 3000
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update order status. Please try again.',
        variant: 'destructive',
        duration: 5000
      });
      console.error('Update error:', error);
    }
  });

  // Invoice upload mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ id, invoiceUrl }: { id: number, invoiceUrl: string }) => {
      const response = await apiRequest('PUT', `/api/orders/${id}/invoice`, { invoiceUrl });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: 'Invoice uploaded',
        description: 'The invoice has been uploaded successfully.',
        duration: 3000
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to upload invoice. Please try again.',
        variant: 'destructive',
        duration: 5000
      });
      console.error('Invoice upload error:', error);
    }
  });

  // Generate sample data for development
  const sampleOrders: Order[] = allOrders || Array(20).fill(0).map((_, index) => {
    const id = 7890 - index;
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30));
    
    const statuses: Array<'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'> = [
      'pending', 'processing', 'shipped', 'delivered', 'cancelled'
    ];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const totalAmount = Math.floor(Math.random() * 500000) + 50000; // Between ₹500 and ₹5,000
    
    const names = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Gupta', 'Vikram Singh', 'Neha Verma'];
    const userName = names[Math.floor(Math.random() * names.length)];
    
    return {
      id,
      userId: Math.floor(Math.random() * 10) + 1,
      status,
      totalAmount,
      shippingAddress: `${Math.floor(Math.random() * 100) + 1}, Some Street, Some City, Some State, India - ${100000 + Math.floor(Math.random() * 900000)}`,
      paymentMethod: Math.random() > 0.3 ? 'razorpay' : 'cod',
      createdAt: createdDate.toISOString(),
      updatedAt: new Date().toISOString(),
      items: Array(Math.floor(Math.random() * 4) + 1).fill(0).map((_, itemIndex) => ({
        id: itemIndex + 1,
        productId: Math.floor(Math.random() * 10) + 1,
        name: `Product ${Math.floor(Math.random() * 100) + 1}`,
        price: Math.floor(Math.random() * 100000) + 10000,
        quantity: Math.floor(Math.random() * 3) + 1
      })),
      userName,
      userEmail: `${userName.toLowerCase().replace(' ', '.')}@example.com`,
      userPhone: `+91 ${9800000000 + Math.floor(Math.random() * 199999999)}`
    };
  });

  // Filter and sort orders
  const filteredOrders = sampleOrders.filter(order => 
    order.id.toString().includes(search) ||
    order.userName?.toLowerCase().includes(search.toLowerCase()) ||
    order.status.toLowerCase().includes(search.toLowerCase())
  );

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortField === 'createdAt') {
      return sortDirection === 'asc' 
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    
    const fieldA = a[sortField as keyof Order];
    const fieldB = b[sortField as keyof Order];

    if (typeof fieldA === 'string' && typeof fieldB === 'string') {
      return sortDirection === 'asc' 
        ? fieldA.localeCompare(fieldB)
        : fieldB.localeCompare(fieldA);
    } else {
      return sortDirection === 'asc'
        ? Number(fieldA) - Number(fieldB)
        : Number(fieldB) - Number(fieldA);
    }
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailOpen(true);
  };

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateOrderStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const formatPrice = (price: number) => {
    return `₹${(price / 100).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Status badge colors
  const statusColors: Record<string, string> = {
    'delivered': 'bg-green-100 text-green-800',
    'shipped': 'bg-blue-100 text-blue-800',
    'processing': 'bg-amber-100 text-amber-800',
    'cancelled': 'bg-red-100 text-red-800',
    'pending': 'bg-neutral-100 text-neutral-800'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Order Management</h1>
      </div>

      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 h-4 w-4" />
          <Input
            placeholder="Search by order ID or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('id')}
                    className="flex items-center font-medium p-0 h-auto"
                  >
                    Order ID 
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('userName')}
                    className="flex items-center font-medium p-0 h-auto"
                  >
                    Customer 
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('createdAt')}
                    className="flex items-center font-medium p-0 h-auto"
                  >
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('totalAmount')}
                    className="flex items-center font-medium p-0 h-auto"
                  >
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('status')}
                    className="flex items-center font-medium p-0 h-auto"
                  >
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <span className="font-medium">Delivery Address</span>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 float-right" /></TableCell>
                  </TableRow>
                ))
              ) : currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-neutral-500">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{order.userName}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>{formatPrice(order.totalAmount)}</TableCell>
                    <TableCell>
                      <Select 
                        defaultValue={order.status} 
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger className={`w-32 h-7 text-xs ${statusColors[order.status]}`}>
                          <SelectValue placeholder={order.status.charAt(0).toUpperCase() + order.status.slice(1)} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {order.shippingAddress}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye className="h-4 w-4 mr-2" /> View
                        </Button>
                        
                        {order.invoiceUrl ? (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(`/api/invoices/download${order.invoiceUrl}`, '_blank')}
                          >
                            <FileImage className="h-4 w-4 mr-2" /> 
                            View Invoice
                          </Button>
                        ) : (
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={10485760} // 10MB
                            acceptedFileTypes={['.png', '.jpg', '.jpeg', '.pdf']}
                            onGetUploadParameters={async () => {
                              const response = await apiRequest('POST', '/api/invoices/upload');
                              const data = await response.json();
                              return {
                                method: 'PUT' as const,
                                url: data.uploadURL,
                              };
                            }}
                            onComplete={(result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
                              if (result.successful && result.successful.length > 0) {
                                const uploadedFile = result.successful[0];
                                const invoiceUrl = uploadedFile.uploadURL;
                                updateInvoiceMutation.mutate({ id: order.id, invoiceUrl });
                              }
                            }}
                            buttonClassName="h-8 text-xs"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Invoice
                          </ObjectUploader>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNumber = index + 1;
                  // Show only current page, first, last, and adjacent pages
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={index}>
                        <PaginationLink
                          isActive={pageNumber === currentPage}
                          onClick={() => setCurrentPage(pageNumber)}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    (pageNumber === currentPage - 2 && currentPage > 3) ||
                    (pageNumber === currentPage + 2 && currentPage < totalPages - 2)
                  ) {
                    return <PaginationItem key={index}>...</PaginationItem>;
                  }
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <Dialog open={isOrderDetailOpen} onOpenChange={setIsOrderDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Order Details #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              View the complete details of this order.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-neutral-500">Customer Information</h3>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Name:</span> {selectedOrder.userName}</p>
                    <p className="text-sm"><span className="font-medium">Email:</span> {selectedOrder.userEmail}</p>
                    <p className="text-sm"><span className="font-medium">Phone:</span> {selectedOrder.userPhone}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-neutral-500">Order Information</h3>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Order Date:</span> {formatDate(selectedOrder.createdAt)}</p>
                    <p className="text-sm"><span className="font-medium">Payment Method:</span> {selectedOrder.paymentMethod === 'razorpay' ? 'Online Payment (Razorpay)' : 'Cash on Delivery'}</p>
                    <p className="text-sm"><span className="font-medium">Order Status:</span> <Badge className={statusColors[selectedOrder.status]}>{selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}</Badge></p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-neutral-500">Shipping Address</h3>
                <p className="text-sm">{selectedOrder.shippingAddress}</p>
              </div>
              
              {selectedOrder.specialInstructions && (
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-neutral-500">Special Instructions</h3>
                  <p className="text-sm">{selectedOrder.specialInstructions}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-neutral-500">Order Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead>
                      <tr className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Variants</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Quantity</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-3">
                              {item.productImage && (
                                <div className="h-12 w-12 bg-neutral-100 rounded-md overflow-hidden flex-shrink-0">
                                  <img 
                                    src={item.productImage} 
                                    alt={item.name} 
                                    className="h-full w-full object-cover" 
                                  />
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium">{item.name}</p>
                                {item.hsnCode && (
                                  <p className="text-xs text-neutral-500">HSN: {item.hsnCode}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              {item.selectedColor && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block w-fit">
                                  Color: {item.selectedColor}
                                </span>
                              )}
                              {item.selectedSize && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded inline-block w-fit">
                                  Size: {item.selectedSize}
                                </span>
                              )}
                              {!item.selectedColor && !item.selectedSize && (
                                <span className="text-xs text-neutral-400">No variants</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm">{formatPrice(item.price)}</td>
                          <td className="px-4 py-4 text-sm">{item.quantity}</td>
                          <td className="px-4 py-4 text-sm text-right">{formatPrice(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-sm font-medium text-right">Subtotal</td>
                        <td className="px-4 py-3 text-sm font-medium text-right">{formatPrice(selectedOrder.totalAmount - 9900)}</td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-sm font-medium text-right">Shipping</td>
                        <td className="px-4 py-3 text-sm font-medium text-right">₹99.00</td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-base font-semibold text-right">Total</td>
                        <td className="px-4 py-3 text-base font-semibold text-right">{formatPrice(selectedOrder.totalAmount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => setIsOrderDetailOpen(false)}>Close</Button>
                <div className="space-x-2">
                  <Select 
                    defaultValue={selectedOrder.status} 
                    onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button>
                    <FileText className="h-4 w-4 mr-2" /> Generate Invoice
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManagement;
