import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import SalesChart from './SalesChart';
import { 
  IndianRupee, 
  ShoppingBag, 
  Users, 
  Package, 
  TrendingUp, 
  ArrowUp, 
  ArrowDown,
  Eye,
  Printer,
  Phone,
  MapPin,
  Mail,
  Calendar,
  CreditCard,
  User,
  Package2
} from 'lucide-react';

interface DashboardStats {
  revenue: { total: number; growth: number };
  orders: { total: number; growth: number };
  customers: { total: number; growth: number };
  products: { total: number; lowStock: number };
}

interface OrderItem {
  id: number;
  productName: string;
  hsnCode: string;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
  price: number;
}

interface RecentOrder {
  id: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: any;
  date: string;
  amount: number;
  status: string;
  paymentMethod: string;
  specialInstructions: string;
  items: OrderItem[];
  printed: boolean;
}

const Dashboard: React.FC = () => {
  const [printedOrders, setPrintedOrders] = useState<Set<number>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<RecentOrder | null>(null);

  const { data: dashboardStats, isLoading: isStatsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/dashboard/stats'],
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  const { data: recentOrders, isLoading: isOrdersLoading } = useQuery<RecentOrder[]>({
    queryKey: ['/api/admin/dashboard/recent-orders'],
    staleTime: 15000, // Consider data fresh for 15 seconds
    gcTime: 3 * 60 * 1000, // Keep in cache for 3 minutes
  });

  const { data: topProducts, isLoading: isProductsLoading } = useQuery({
    queryKey: ['/api/admin/dashboard/top-products'],
    staleTime: 60000, // Consider data fresh for 1 minute
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const handlePrint = (order: RecentOrder) => {
    // Calculate GST and other details for each item
    const calculateItemDetails = (item: any) => {
      const grossAmount = item.price * item.quantity;
      const discountAmount = 0; // Can be enhanced to include actual discounts
      const netAmount = grossAmount - discountAmount;
      const gstRate = 18; // 18% GST for electronics
      const gstAmount = (netAmount * gstRate) / (100 + gstRate);
      const taxableValue = netAmount - gstAmount;
      
      return {
        ...item,
        grossAmount,
        discountAmount,
        taxableValue,
        gstAmount,
        netAmount
      };
    };

    const itemsWithDetails = order.items.map(calculateItemDetails);
    const totalItems = itemsWithDetails.reduce((sum, item) => sum + item.quantity, 0);
    const totalGrossAmount = itemsWithDetails.reduce((sum, item) => sum + item.grossAmount, 0);
    const totalDiscountAmount = itemsWithDetails.reduce((sum, item) => sum + item.discountAmount, 0);
    const totalTaxableValue = itemsWithDetails.reduce((sum, item) => sum + item.taxableValue, 0);
    const totalGstAmount = itemsWithDetails.reduce((sum, item) => sum + item.gstAmount, 0);
    const grandTotal = order.amount;

    // Generate print content
    const printContent = `
      <html>
        <head>
          <title>Tax Invoice - Order #${order.id}</title>
          <style>
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 15px; 
              font-size: 12px;
              line-height: 1.4;
            }
            .header { 
              text-align: center; 
              margin-bottom: 25px; 
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
            }
            .company-name { 
              font-size: 24px; 
              font-weight: bold; 
              color: #2563eb;
              margin-bottom: 5px;
            }
            .invoice-title { 
              font-size: 18px; 
              font-weight: bold; 
              margin: 10px 0;
            }
            .invoice-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .customer-section, .invoice-section {
              flex: 1;
              margin: 0 10px;
              border: 1px solid #ddd;
              padding: 12px;
              border-radius: 5px;
            }
            .section-title {
              font-weight: bold;
              font-size: 14px;
              color: #333;
              margin-bottom: 8px;
              border-bottom: 1px solid #eee;
              padding-bottom: 4px;
            }
            .total-items {
              text-align: center;
              font-weight: bold;
              margin: 15px 0;
              font-size: 14px;
            }
            .items-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 15px 0;
              font-size: 11px;
            }
            .items-table th { 
              background-color: #f8f9fa; 
              border: 1px solid #333;
              padding: 8px 6px;
              text-align: center;
              font-weight: bold;
              font-size: 10px;
            }
            .items-table td { 
              border: 1px solid #333; 
              padding: 8px 6px;
              text-align: center;
              vertical-align: top;
            }
            .product-cell {
              text-align: left !important;
              max-width: 140px;
            }
            .product-name {
              font-weight: bold;
              margin-bottom: 3px;
            }
            .product-details {
              font-size: 9px;
              color: #666;
              line-height: 1.2;
            }
            .warranty-info {
              font-style: italic;
              color: #888;
            }
            .totals-row {
              background-color: #f8f9fa;
              font-weight: bold;
            }
            .grand-total {
              text-align: right;
              margin: 20px 0;
              padding: 15px;
              border: 2px solid #333;
              background-color: #f8f9fa;
            }
            .grand-total-amount {
              font-size: 20px;
              font-weight: bold;
              color: #2563eb;
            }
            .company-footer {
              margin-top: 30px;
              text-align: right;
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }
            .signature-area {
              margin-top: 40px;
              text-align: right;
            }
            @media print { 
              body { margin: 0; }
              .items-table { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Blinkeach</div>
            <div class="invoice-title">Tax Invoice</div>
            <p><strong>Invoice #${order.id}</strong></p>
          </div>
          
          <div class="total-items">Total items: ${totalItems}</div>
          
          <div class="invoice-details">
            <div class="customer-section">
              <div class="section-title">Bill To</div>
              <p><strong>${order.customerName}</strong></p>
              <p>Phone: ${order.customerPhone}</p>
              <p>Email: ${order.customerEmail}</p>
              <div style="margin-top: 10px;">
                <strong>Shipping Address:</strong><br>
                ${order.shippingAddress || 'N/A'}
              </div>
            </div>
            
            <div class="invoice-section">
              <div class="section-title">Invoice Details</div>
              <p><strong>Order ID:</strong> #${order.id}</p>
              <p><strong>Date:</strong> ${new Date(order.date).toLocaleDateString('en-IN', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })}</p>
              <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
              <p><strong>Payment:</strong> ${order.paymentMethod}</p>
              ${order.specialInstructions && order.specialInstructions !== 'None' ? 
                `<p><strong>Instructions:</strong> ${order.specialInstructions}</p>` : ''
              }
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th rowspan="2">Product</th>
                <th rowspan="2">Title</th>
                <th rowspan="2">Qty</th>
                <th rowspan="2">Gross<br>Amount ₹</th>
                <th rowspan="2">Discounts<br>/Coupons ₹</th>
                <th rowspan="2">Taxable<br>Value ₹</th>
                <th rowspan="2">IGST ₹</th>
                <th rowspan="2">Total ₹</th>
              </tr>
            </thead>
            <tbody>
              ${itemsWithDetails.map(item => `
                <tr>
                  <td class="product-cell">
                    <div class="product-name">${item.productName}</div>
                    <div class="product-details">
                      FSN: ${item.productName.substring(0, 6).toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}<br>
                      HSN/SAC: ${item.hsnCode}<br>
                      <span class="warranty-info">Warranty: This product comes with standard manufacturer warranty of 1 year.</span><br>
                      <strong>IGST: 18.0 %</strong>
                    </div>
                  </td>
                  <td>
                    <strong>${item.productName}</strong><br>
                    <small>Color: ${item.selectedColor}<br>Size: ${item.selectedSize}</small>
                  </td>
                  <td>${item.quantity}</td>
                  <td>${(item.grossAmount / 100).toFixed(2)}</td>
                  <td>${(item.discountAmount / 100).toFixed(2)}</td>
                  <td>${(item.taxableValue / 100).toFixed(2)}</td>
                  <td>${(item.gstAmount / 100).toFixed(2)}</td>
                  <td><strong>${(item.netAmount / 100).toFixed(2)}</strong></td>
                </tr>
              `).join('')}
              ${totalItems > 1 ? `
                <tr class="totals-row">
                  <td colspan="2"><strong>Total</strong></td>
                  <td><strong>${totalItems}</strong></td>
                  <td><strong>${(totalGrossAmount / 100).toFixed(2)}</strong></td>
                  <td><strong>${(totalDiscountAmount / 100).toFixed(2)}</strong></td>
                  <td><strong>${(totalTaxableValue / 100).toFixed(2)}</strong></td>
                  <td><strong>${(totalGstAmount / 100).toFixed(2)}</strong></td>
                  <td><strong>${(grandTotal / 100).toFixed(2)}</strong></td>
                </tr>
              ` : ''}
            </tbody>
          </table>
          
          <div class="grand-total">
            <div style="text-align: center;">
              <div style="font-size: 16px; margin-bottom: 5px;"><strong>Grand Total</strong></div>
              <div class="grand-total-amount">₹ ${(grandTotal / 100).toFixed(2)}</div>
            </div>
          </div>

          <div class="company-footer">
            <div style="font-weight: bold; font-size: 14px;">Blinkeach Retail Private Limited</div>
            <div class="signature-area">
              <div style="margin-top: 20px; font-style: italic;">
                ____________________<br>
                <strong>Authorized Signatory</strong>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      
      // Mark as printed
      setPrintedOrders(prev => {
        const newSet = new Set(prev);
        newSet.add(order.id);
        return newSet;
      });
    }
  };

  const formatPrice = (amount: number) => {
    return `₹${(amount / 100).toLocaleString('en-IN')}`;
  };

  // Use actual data or empty arrays as fallback
  const stats = dashboardStats || { revenue: { total: 0, growth: 0 }, orders: { total: 0, growth: 0 }, customers: { total: 0, growth: 0 }, products: { total: 0, lowStock: 0 } };
  const orders = recentOrders || [];
  const products = topProducts || [];

  // Status badge colors
  const statusColors: Record<string, string> = {
    'delivered': 'bg-green-100 text-green-800',
    'shipped': 'bg-blue-100 text-blue-800',
    'processing': 'bg-yellow-100 text-yellow-800',
    'cancelled': 'bg-red-100 text-red-800',
    'confirmed': 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-600 text-sm">Total Revenue</p>
                {isStatsLoading ? (
                  <Skeleton className="h-8 w-32 mt-1" />
                ) : (
                  <h3 className="text-2xl font-bold text-neutral-800">{formatPrice(stats.revenue.total)}</h3>
                )}
                {isStatsLoading ? (
                  <Skeleton className="h-4 w-24 mt-1" />
                ) : (
                  <p className={`text-xs flex items-center ${stats.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.revenue.growth >= 0 ? (
                      <ArrowUp className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(stats.revenue.growth)}% from last month
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
                <IndianRupee className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Orders */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-600 text-sm">Total Orders</p>
                {isStatsLoading ? (
                  <Skeleton className="h-8 w-20 mt-1" />
                ) : (
                  <h3 className="text-2xl font-bold text-neutral-800">{stats.orders.total}</h3>
                )}
                {isStatsLoading ? (
                  <Skeleton className="h-4 w-24 mt-1" />
                ) : (
                  <p className={`text-xs flex items-center ${stats.orders.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.orders.growth >= 0 ? (
                      <ArrowUp className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(stats.orders.growth)}% from last month
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                <ShoppingBag className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Customers */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-600 text-sm">New Customers</p>
                {isStatsLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <h3 className="text-2xl font-bold text-neutral-800">{stats.customers.total}</h3>
                )}
                {isStatsLoading ? (
                  <Skeleton className="h-4 w-24 mt-1" />
                ) : (
                  <p className={`text-xs flex items-center ${stats.customers.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.customers.growth >= 0 ? (
                      <ArrowUp className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(stats.customers.growth)}% from last month
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-500">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Products */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-600 text-sm">Total Products</p>
                {isStatsLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <h3 className="text-2xl font-bold text-neutral-800">{stats.products.total}</h3>
                )}
                {isStatsLoading ? (
                  <Skeleton className="h-4 w-24 mt-1" />
                ) : (
                  <p className="text-xs text-orange-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stats.products.lowStock} low stock
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              {isStatsLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <SalesChart chartType="line" />
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              {isProductsLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <SalesChart chartType="bar" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-neutral-50 text-neutral-600 text-left text-sm">
                  <th className="py-3 px-4 font-medium">Order ID</th>
                  <th className="py-3 px-4 font-medium">Customer</th>
                  <th className="py-3 px-4 font-medium">Phone</th>
                  <th className="py-3 px-4 font-medium">Address</th>
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Amount</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">HSN/Products</th>
                  <th className="py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isOrdersLoading ? (
                  Array(3).fill(0).map((_, index) => (
                    <tr key={index}>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-16" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-32" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-24" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-32" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-24" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-20" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-24" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-24" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-16" /></td>
                    </tr>
                  ))
                ) : (
                  orders.map((order: RecentOrder) => (
                    <tr key={order.id} className="text-sm">
                      <td className="py-3 px-4">#{order.id}</td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-xs text-gray-500">{order.customerEmail}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1 text-gray-400" />
                          <span className="text-xs">{order.customerPhone || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-48">
                        <div className="flex items-start">
                          <MapPin className="h-3 w-3 mr-1 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-gray-600 truncate">
                            {order.shippingAddress || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                          {new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <IndianRupee className="h-3 w-3 mr-1 text-gray-400" />
                          {formatPrice(order.amount)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${statusColors[order.status] || 'bg-neutral-100'}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-32">
                          {order.items.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="text-xs mb-1">
                              <div className="font-medium truncate">{item.productName}</div>
                              <div className="text-gray-500">
                                HSN: {item.hsnCode} | {item.selectedColor} | {item.selectedSize}
                              </div>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <div className="text-xs text-gray-500">+{order.items.length - 2} more</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Order Details - #{order.id}</DialogTitle>
                              </DialogHeader>
                              {selectedOrder && (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="flex items-center text-lg">
                                          <User className="h-5 w-5 mr-2" />
                                          Customer Information
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-3">
                                        <div className="flex items-center">
                                          <User className="h-4 w-4 mr-2 text-gray-400" />
                                          <span className="font-medium">{selectedOrder.customerName}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                          <span>{selectedOrder.customerPhone}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                          <span>{selectedOrder.customerEmail}</span>
                                        </div>
                                        <div className="flex items-start">
                                          <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-1" />
                                          <div>
                                            <div className="font-medium">Shipping Address:</div>
                                            <div className="text-sm text-gray-600 whitespace-pre-wrap">
                                              {selectedOrder.shippingAddress || 'No address provided'}
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="flex items-center text-lg">
                                          <Package2 className="h-5 w-5 mr-2" />
                                          Order Information
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-3">
                                        <div className="flex items-center">
                                          <Package className="h-4 w-4 mr-2 text-gray-400" />
                                          <span className="font-medium">Order #{selectedOrder.id}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                          <span>{new Date(selectedOrder.date).toLocaleDateString('en-IN', { 
                                            day: '2-digit', 
                                            month: 'long', 
                                            year: 'numeric' 
                                          })}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                                          <span>{selectedOrder.paymentMethod}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <span className={`px-3 py-1 rounded-full text-sm ${statusColors[selectedOrder.status] || 'bg-neutral-100'}`}>
                                            {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                                          </span>
                                        </div>
                                        {selectedOrder.specialInstructions && selectedOrder.specialInstructions !== 'None' && (
                                          <div>
                                            <div className="font-medium text-sm">Special Instructions:</div>
                                            <div className="text-sm text-gray-600">{selectedOrder.specialInstructions}</div>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  </div>

                                  <Card>
                                    <CardHeader>
                                      <CardTitle>Order Items</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="overflow-x-auto">
                                        <table className="w-full">
                                          <thead>
                                            <tr className="bg-gray-50 text-gray-600 text-left text-sm">
                                              <th className="py-2 px-3 font-medium">Product</th>
                                              <th className="py-2 px-3 font-medium">HSN Code</th>
                                              <th className="py-2 px-3 font-medium">Color</th>
                                              <th className="py-2 px-3 font-medium">Size</th>
                                              <th className="py-2 px-3 font-medium">Quantity</th>
                                              <th className="py-2 px-3 font-medium">Price</th>
                                              <th className="py-2 px-3 font-medium">Total</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y">
                                            {selectedOrder.items.map((item, index) => (
                                              <tr key={index} className="text-sm">
                                                <td className="py-2 px-3 font-medium">{item.productName}</td>
                                                <td className="py-2 px-3">{item.hsnCode}</td>
                                                <td className="py-2 px-3">{item.selectedColor}</td>
                                                <td className="py-2 px-3">{item.selectedSize}</td>
                                                <td className="py-2 px-3">{item.quantity}</td>
                                                <td className="py-2 px-3">{formatPrice(item.price)}</td>
                                                <td className="py-2 px-3 font-medium">{formatPrice(item.price * item.quantity)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                      <div className="mt-4 text-right">
                                        <div className="text-lg font-bold">
                                          Total: {formatPrice(selectedOrder.amount)}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handlePrint(order)}
                          >
                            <Printer 
                              className={`h-4 w-4 ${
                                printedOrders.has(order.id) ? 'text-green-600' : 'text-gray-600'
                              }`} 
                            />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-neutral-50 text-neutral-600 text-left text-sm">
                  <th className="py-3 px-4 font-medium">Product</th>
                  <th className="py-3 px-4 font-medium">SKU</th>
                  <th className="py-3 px-4 font-medium">Category</th>
                  <th className="py-3 px-4 font-medium">Price</th>
                  <th className="py-3 px-4 font-medium">Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isProductsLoading ? (
                  Array(3).fill(0).map((_, index) => (
                    <tr key={index}>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-32" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-20" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-24" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-20" /></td>
                      <td className="py-3 px-4"><Skeleton className="h-5 w-16" /></td>
                    </tr>
                  ))
                ) : (
                  Array.isArray(products) && products.map((product: any) => (
                    <tr key={product.id} className="text-sm">
                      <td className="py-3 px-4 font-medium">{product.name}</td>
                      <td className="py-3 px-4">{product.sku}</td>
                      <td className="py-3 px-4">{product.category}</td>
                      <td className="py-3 px-4">{formatPrice(product.price)}</td>
                      <td className="py-3 px-4">{product.sales}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;