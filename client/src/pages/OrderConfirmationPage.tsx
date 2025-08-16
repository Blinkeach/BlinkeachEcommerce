import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, ShoppingBag, ChevronRight, Copy } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

const OrderConfirmationPage: React.FC = () => {
  const [location] = useLocation();
  const { toast } = useToast();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

  useEffect(() => {
    // Extract order ID and payment method from URL
    const params = new URLSearchParams(window.location.search);
    const orderIdParam = params.get('orderId');
    const paymentMethodParam = params.get('paymentMethod');
    
    setOrderId(orderIdParam);
    setPaymentMethod(paymentMethodParam);
  }, []);

  const copyOrderId = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId);
      toast({
        description: "Order ID copied to clipboard",
        duration: 3000
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Order Confirmation - Blinkeach</title>
        <meta name="description" content="Your order has been successfully placed. Thank you for shopping with us!" />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">Thank You for Your Order!</h1>
          <p className="text-neutral-600 mb-6">
            Your order has been successfully {paymentMethod === 'cod' ? 'placed' : 'paid'} and is being processed.
          </p>
          
          <div className="bg-neutral-50 rounded-md p-4 mb-6 inline-block">
            <div className="flex items-center justify-center">
              <span className="text-sm text-neutral-500 mr-2">Order ID:</span>
              <span className="font-medium">{orderId || "N/A"}</span>
              {orderId && (
                <button 
                  onClick={copyOrderId}
                  className="ml-2 text-secondary hover:text-secondary-dark"
                  aria-label="Copy order ID"
                >
                  <Copy className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="text-sm text-neutral-500 mt-1">
              Payment Method: <span className="font-medium capitalize">{
                paymentMethod === 'cod' ? 'Cash on Delivery' : 
                paymentMethod === 'razorpay' ? 'Online Payment (Razorpay)' : 
                paymentMethod || 'N/A'
              }</span>
            </div>
          </div>
          
          <Separator className="mb-6" />
          
          <div className="mb-8">
            <h2 className="font-semibold text-lg mb-4">What Happens Next?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-neutral-50 p-4 rounded-md">
                <div className="flex justify-center mb-3">
                  <div className="bg-secondary/10 rounded-full p-2">
                    <ShoppingBag className="h-6 w-6 text-secondary" />
                  </div>
                </div>
                <h3 className="font-medium text-sm mb-1">Order Processing</h3>
                <p className="text-xs text-neutral-500">We're preparing your order for shipment</p>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-md">
                <div className="flex justify-center mb-3">
                  <div className="bg-secondary/10 rounded-full p-2">
                    <Package className="h-6 w-6 text-secondary" />
                  </div>
                </div>
                <h3 className="font-medium text-sm mb-1">Order Shipped</h3>
                <p className="text-xs text-neutral-500">You'll receive shipping confirmation with tracking details</p>
              </div>
              
              <div className="bg-neutral-50 p-4 rounded-md">
                <div className="flex justify-center mb-3">
                  <div className="bg-secondary/10 rounded-full p-2">
                    <CheckCircle className="h-6 w-6 text-secondary" />
                  </div>
                </div>
                <h3 className="font-medium text-sm mb-1">Order Delivery</h3>
                <p className="text-xs text-neutral-500">
                  {paymentMethod === 'cod' 
                    ? 'Pay cash when your order arrives at your doorstep'
                    : 'Your order will be delivered to your address'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Link href="/">
              <Button variant="outline" className="w-full md:w-auto">
                Continue Shopping
              </Button>
            </Link>
            <Link href="/orders">
              <Button className="w-full md:w-auto bg-secondary hover:bg-secondary-dark">
                View Your Order <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderConfirmationPage;