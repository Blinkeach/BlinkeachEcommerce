import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Download,
  ChevronRight,
  FileText,
  ShoppingBag,
  RotateCcw,
  MessageCircle
} from 'lucide-react';
import ReturnRequestForm from '@/components/returns/ReturnRequestForm';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/hooks/use-auth';
import { generateEnhancedInvoice } from '@/lib/enhanced-invoice';
import { apiRequest } from '@/lib/queryClient';

// Interfaces for order data
interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  name: string;
  quantity: number;
  price: number;
  productName: string;
  productImage: string;
  selectedColor?: string | null;
  selectedSize?: string | null;
  hsnCode?: string | null;
}

interface ReturnRequest {
  id: number;
  orderId: number;
  userId: number;
  reason: string;
  details?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  adminNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Order {
  id: number;
  userId: number;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  shippingAddress: string;
  city: string;
  state: string;
  pincode: string;
  phoneNumber: string;
  trackingId?: string;
  invoiceUrl?: string | null; // Added for admin uploaded invoices
  items: OrderItem[];
  returnRequest?: ReturnRequest; // Added to link return request info to order
}

const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [returnOrderId, setReturnOrderId] = useState<number | null>(null);
  const [ordersWithReturnInfo, setOrdersWithReturnInfo] = useState<Order[]>([]);
  
  // Fetch orders for the logged-in user
  const { data: orders, isLoading: ordersLoading, error: ordersError, refetch } = useQuery<Order[]>({
    queryKey: ['/api/orders/user'],
    enabled: !!user?.id,
    onError: (err) => {
      console.error('Error fetching orders:', err);
      toast({
        title: "Error",
        description: "Failed to load your orders. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    }
  });
  
  // Fetch return requests for the user
  const { data: returnRequests, isLoading: returnsLoading, error: returnsError } = useQuery<ReturnRequest[]>({
    queryKey: ['/api/returns/user'],
    enabled: !!user?.id,
    onSuccess: (returnData) => {
      // When return data is loaded, combine with orders
      if (orders && returnData) {
        const updatedOrders = orders.map(order => {
          // Find matching return request for this order
          const returnRequest = returnData.find(req => req.orderId === order.id);
          return returnRequest ? { ...order, returnRequest } : order;
        });
        setOrdersWithReturnInfo(updatedOrders);
      }
    },
    onError: (err) => {
      console.error('Error fetching return requests:', err);
    }
  });
  
  // Update ordersWithReturnInfo when orders change
  useEffect(() => {
    if (orders && returnRequests) {
      const updatedOrders = orders.map(order => {
        // Find matching return request for this order
        const returnRequest = returnRequests.find(req => req.orderId === order.id);
        return returnRequest ? { ...order, returnRequest } : order;
      });
      setOrdersWithReturnInfo(updatedOrders);
    } else if (orders) {
      setOrdersWithReturnInfo(orders);
    }
  }, [orders, returnRequests]);
  
  // Determine if loading or error state
  const isLoading = ordersLoading || returnsLoading;
  const error = ordersError || returnsError;
  
  // Filter orders by status
  const pendingOrders = ordersWithReturnInfo?.filter(order => ['pending', 'processing'].includes(order.status.toLowerCase())) || [];
  const shippedOrders = ordersWithReturnInfo?.filter(order => order.status.toLowerCase() === 'shipped') || [];
  const deliveredOrders = ordersWithReturnInfo?.filter(order => order.status.toLowerCase() === 'delivered') || [];
  const cancelledOrders = ordersWithReturnInfo?.filter(order => order.status.toLowerCase() === 'cancelled') || [];
  
  // Download invoice
  const downloadInvoice = async (order: Order) => {
    try {
      // First check if admin has uploaded an invoice
      if (!order.invoiceUrl) {
        toast({
          title: "Invoice Not Available",
          description: (
            <div className="flex flex-col gap-2">
              <p>Your invoice is being prepared by our team.</p>
              <p className="text-sm text-muted-foreground">
                Please contact our support team via live chat for assistance.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-fit mt-2"
                onClick={() => {
                  // Redirect to live chat or open chat widget
                  window.location.href = '/support';
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </div>
          ),
          duration: 8000
        });
        return;
      }

      // If admin has uploaded invoice, download it
      try {
        // Construct the server URL for invoice download
        const invoiceUrl = order.invoiceUrl.startsWith('/') 
          ? `${window.location.origin}${order.invoiceUrl}`
          : order.invoiceUrl;
          
        const response = await fetch(invoiceUrl);
        if (!response.ok) {
          throw new Error('Failed to download invoice');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${order.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Invoice Downloaded",
          description: `Invoice for order #${order.id} has been downloaded successfully.`,
          duration: 3000
        });
      } catch (downloadError) {
        console.error('Error downloading admin invoice:', downloadError);
        
        // Fallback to generating invoice if download fails
        console.log('Falling back to generated invoice for order:', JSON.stringify(order, null, 2));
        
        // Ensure order data is complete for generation
        if (!order || !order.id) {
          throw new Error('Invalid order data');
        }
        
        // Check if items array exists and has content
        if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
          console.error('Order items missing or empty:', order);
          toast({
            title: "Error",
            description: "Could not generate invoice: Order items data is missing",
            variant: "destructive",
            duration: 5000
          });
          return;
        }
        
        // Generate the enhanced PDF invoice as fallback
        await generateEnhancedInvoice(order);
        
        toast({
          title: "Invoice Downloaded",
          description: `Professional invoice for order #${order.id} has been downloaded successfully.`,
          duration: 3000
        });
      }
    } catch (error: any) {
      console.error('Error handling invoice:', error);
      
      // Provide more specific error message if available
      const errorMessage = error?.message || "Failed to process invoice. Please contact support.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      });
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch(status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Get return request status display
  const getReturnRequestStatus = (returnRequest: ReturnRequest) => {
    switch(returnRequest.status) {
      case 'pending':
        return {
          label: 'Return request waiting for approval',
          className: 'bg-amber-100 text-amber-800',
          icon: <Clock className="h-5 w-5" />
        };
      case 'approved':
        return {
          label: 'Return approved - Ready for pickup',
          className: 'bg-green-100 text-green-800',
          icon: <CheckCircle2 className="h-5 w-5" />
        };
      case 'rejected':
        return {
          label: `Return rejected${returnRequest.adminNotes ? ': ' + returnRequest.adminNotes : ''}`,
          className: 'bg-red-100 text-red-800',
          icon: <AlertCircle className="h-5 w-5" />
        };
      case 'completed':
        return {
          label: 'Return completed',
          className: 'bg-blue-100 text-blue-800',
          icon: <CheckCircle2 className="h-5 w-5" />
        };
      case 'cancelled':
        return {
          label: 'Return cancelled',
          className: 'bg-neutral-100 text-neutral-800',
          icon: <AlertCircle className="h-5 w-5" />
        };
      default:
        return {
          label: 'Return status unknown',
          className: 'bg-neutral-100 text-neutral-800',
          icon: <AlertCircle className="h-5 w-5" />
        };
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  // Order detail view
  const OrderDetail = ({ order }: { order: Order }) => (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Order #{order.id}</CardTitle>
            <CardDescription>Placed on {formatDate(order.createdAt)}</CardDescription>
          </div>
          <div className="flex gap-2">
            {order.status.toLowerCase() === 'delivered' && !order.returnRequest && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1" 
                onClick={() => setReturnOrderId(order.id)}
              >
                <RotateCcw className="h-4 w-4" />
                <span>Request Return</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1" 
              onClick={() => downloadInvoice(order)}
            >
              <Download className="h-4 w-4" />
              <span>Invoice</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Badge className={`
              ${order.status.toLowerCase() === 'pending' ? 'bg-orange-100 text-orange-800' : ''}
              ${order.status.toLowerCase() === 'processing' ? 'bg-blue-100 text-blue-800' : ''}
              ${order.status.toLowerCase() === 'shipped' ? 'bg-purple-100 text-purple-800' : ''}
              ${order.status.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-800' : ''}
              ${order.status.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
            `}>
              {getStatusIcon(order.status)}
              <span className="ml-1 capitalize">{order.status}</span>
            </Badge>
            {order.trackingId && (
              <div className="text-sm text-neutral-500">
                Tracking ID: <span className="font-medium">{order.trackingId}</span>
              </div>
            )}
          </div>
          
          {/* Return Request Status */}
          {order.returnRequest && (
            <Badge className={`${getReturnRequestStatus(order.returnRequest).className} flex items-center py-1.5 px-2 mt-1`}>
              {getReturnRequestStatus(order.returnRequest).icon}
              <span className="ml-1">{getReturnRequestStatus(order.returnRequest).label}</span>
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Shipping Address</h3>
            <p className="text-sm text-neutral-600">
              {order.shippingAddress}<br />
              {order.city}, {order.state} - {order.pincode}<br />
              Phone: {order.phoneNumber}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Payment Information</h3>
            <div className="text-sm text-neutral-600">
              <div>Method: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                    order.paymentMethod === 'razorpay' ? 'Online Payment (Razorpay)' : 
                    order.paymentMethod || 'N/A'}</div>
              <div className="mt-2 space-y-1">
                {/* Calculate pricing breakdown */}
                <div className="flex justify-between">
                  <span>Items Total:</span>
                  <span>₹{(order.items.reduce((total, item) => total + (item.price * item.quantity), 0) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span>₹40.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Universal Discount:</span>
                  <span>-₹40.00</span>
                </div>
                {order.paymentMethod === 'cod' && (
                  <div className="flex justify-between">
                    <span>COD Charges:</span>
                    <span>₹10.00</span>
                  </div>
                )}
                {order.paymentMethod === 'razorpay' && (
                  <div className="flex justify-between">
                    <span>Online Payment Discount:</span>
                    <span>-₹{order.totalAmount >= 100000 ? '50.00' : '5.00'}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Total:</span>
                  <span>₹{(order.totalAmount / 100).toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-2">Items: {order.items.reduce((total, item) => total + item.quantity, 0)}</div>
            </div>
          </div>
        </div>
        
        <h3 className="text-sm font-medium mb-2">Order Items</h3>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-neutral-100 rounded-md overflow-hidden flex-shrink-0">
                {item.productImage && (
                  <img 
                    src={item.productImage} 
                    alt={item.productName} 
                    className="h-full w-full object-cover" 
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{item.productName}</p>
                {(item.selectedColor || item.selectedSize) && (
                  <div className="flex gap-2 mt-1">
                    {item.selectedColor && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Color: {item.selectedColor}
                      </span>
                    )}
                    {item.selectedSize && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Size: {item.selectedSize}
                      </span>
                    )}
                  </div>
                )}
                {item.hsnCode && (
                  <p className="text-xs text-neutral-500 mt-1">HSN: {item.hsnCode}</p>
                )}
                <div className="flex justify-between mt-1">
                  <p className="text-sm text-neutral-500">Qty: {item.quantity}</p>
                  <p className="text-sm">₹{((item.price / 100) * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Order summary card
  const OrderCard = ({ order }: { order: Order }) => (
    <Card 
      key={order.id} 
      className={`mb-4 cursor-pointer hover:border-secondary transition-colors ${selectedOrderId === order.id ? 'border-secondary' : ''}`}
      onClick={() => setSelectedOrderId(order.id)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Order #{order.id}</h3>
              <Badge className={`
                ${order.status.toLowerCase() === 'pending' ? 'bg-orange-100 text-orange-800' : ''}
                ${order.status.toLowerCase() === 'processing' ? 'bg-blue-100 text-blue-800' : ''}
                ${order.status.toLowerCase() === 'shipped' ? 'bg-purple-100 text-purple-800' : ''}
                ${order.status.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-800' : ''}
                ${order.status.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
              `}>
                {getStatusIcon(order.status)}
                <span className="ml-1 capitalize">{order.status}</span>
              </Badge>
            </div>
            
            {/* Show return request status in card view */}
            {order.returnRequest && (
              <div className="mt-1">
                <Badge variant="outline" className={`${getReturnRequestStatus(order.returnRequest).className} text-xs py-0.5`}>
                  {getReturnRequestStatus(order.returnRequest).icon}
                  <span className="ml-1 truncate max-w-[200px]">
                    {getReturnRequestStatus(order.returnRequest).label}
                  </span>
                </Badge>
              </div>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-neutral-400" />
        </div>
        
        <p className="text-sm text-neutral-500">
          {formatDate(order.createdAt)} • ₹{(order.totalAmount / 100).toFixed(2)} • 
          {order.paymentMethod === 'cod' ? ' Cash on Delivery' : ' Online Payment'}
        </p>
        
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-neutral-500">
            {order.items.reduce((total, item) => total + item.quantity, 0)} item(s)
          </span>
          <div className="flex space-x-1">
            {order.status.toLowerCase() === 'delivered' && !order.returnRequest && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-secondary hover:text-secondary-dark"
                onClick={(e) => {
                  e.stopPropagation();
                  setReturnOrderId(order.id);
                }}
              >
                <RotateCcw className="h-4 w-4 mr-1" /> Return
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-secondary hover:text-secondary-dark"
              onClick={(e) => {
                e.stopPropagation();
                downloadInvoice(order);
              }}
            >
              <FileText className="h-4 w-4 mr-1" /> Invoice
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  // Empty state component
  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-neutral-100 rounded-full p-6 mb-4">
        <ShoppingBag className="h-12 w-12 text-neutral-400" />
      </div>
      <h3 className="text-lg font-medium mb-2">No Orders Found</h3>
      <p className="text-neutral-500 max-w-md mb-6">{message}</p>
      <Button asChild>
        <a href="/shop">Continue Shopping</a>
      </Button>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>My Orders - Blinkeach</title>
      </Helmet>
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">My Orders</h1>
            <p className="text-neutral-500">View and track your order history</p>
          </div>
        </div>

        {!user ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
              <p className="text-neutral-500 text-center mb-6">You need to be logged in to view your orders. Please sign in to continue.</p>
              <Button asChild>
                <a href="/auth">Sign In</a>
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Error Loading Orders</h3>
              <p className="text-neutral-500 text-center">There was a problem loading your orders. Please try again.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => refetch()}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : orders && orders.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <Tabs defaultValue="all" className="mb-6">
                <TabsList className="w-full grid grid-cols-5">
                  <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
                  <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
                  <TabsTrigger value="shipped">Shipped ({shippedOrders.length})</TabsTrigger>
                  <TabsTrigger value="delivered">Delivered ({deliveredOrders.length})</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled ({cancelledOrders.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-4">
                  {orders.map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </TabsContent>
                
                <TabsContent value="pending" className="mt-4">
                  {pendingOrders.length > 0 ? (
                    pendingOrders.map(order => (
                      <OrderCard key={order.id} order={order} />
                    ))
                  ) : (
                    <EmptyState message="You don't have any pending orders at the moment." />
                  )}
                </TabsContent>
                
                <TabsContent value="shipped" className="mt-4">
                  {shippedOrders.length > 0 ? (
                    shippedOrders.map(order => (
                      <OrderCard key={order.id} order={order} />
                    ))
                  ) : (
                    <EmptyState message="You don't have any shipped orders at the moment." />
                  )}
                </TabsContent>
                
                <TabsContent value="delivered" className="mt-4">
                  {deliveredOrders.length > 0 ? (
                    deliveredOrders.map(order => (
                      <OrderCard key={order.id} order={order} />
                    ))
                  ) : (
                    <EmptyState message="You don't have any delivered orders yet." />
                  )}
                </TabsContent>
                
                <TabsContent value="cancelled" className="mt-4">
                  {cancelledOrders.length > 0 ? (
                    cancelledOrders.map(order => (
                      <OrderCard key={order.id} order={order} />
                    ))
                  ) : (
                    <EmptyState message="You don't have any cancelled orders." />
                  )}
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="lg:col-span-7">
              {selectedOrderId ? (
                <div>
                  <h2 className="text-xl font-bold mb-4">Order Details</h2>
                  {orders
                    .filter(order => order.id === selectedOrderId)
                    .map(order => (
                      <OrderDetail key={order.id} order={order} />
                    ))
                  }
                </div>
              ) : (
                <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-8 text-center h-full flex flex-col items-center justify-center">
                  <Package className="h-12 w-12 text-neutral-400 mb-4" />
                  <h2 className="text-xl font-bold mb-2">Select an Order</h2>
                  <p className="text-neutral-500 mb-2">
                    Click on an order from the list to view its details
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <EmptyState message="You haven't placed any orders yet. Browse our products and make your first purchase!" />
        )}
        
        {/* Return Request Modal */}
        {returnOrderId && (
          <ReturnRequestForm 
            orderId={returnOrderId}
            isOpen={returnOrderId !== null}
            onClose={() => setReturnOrderId(null)}
          />
        )}
      </div>
    </>
  );
};

export default OrdersPage;