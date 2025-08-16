import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Package, TruckIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

interface TrackingStatus {
  status: 'processing' | 'shipped' | 'out-for-delivery' | 'delivered' | 'failed';
  date: string;
  location?: string;
  description: string;
}

interface OrderTracking {
  orderId: string;
  trackingId: string;
  carrier: string;
  estimatedDelivery: string;
  currentStatus: 'processing' | 'shipped' | 'out-for-delivery' | 'delivered' | 'failed';
  timeline: TrackingStatus[];
}

const TrackOrderPage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [orderNumber, setOrderNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState<OrderTracking | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (isAuthenticated === false) {
      toast({
        title: "Authentication Required",
        description: "Please log in to track your order",
        variant: "destructive",
      });
      setLocation('/login?redirect=/track-order');
    }
  }, [isAuthenticated, toast, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid order number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call to get order tracking information
    setTimeout(() => {
      // This is a placeholder, in a real app, this would be an actual API call
      // const response = await fetch(\`/api/orders/${orderNumber}/track\`);
      // const data = await response.json();
      
      // Mock data for demonstration
      const mockData: OrderTracking = {
        orderId: orderNumber,
        trackingId: 'TRK' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        carrier: 'Delhivery Express',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
        currentStatus: 'shipped',
        timeline: [
          {
            status: 'processing',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleString('en-IN'),
            description: 'Order confirmed and payment received'
          },
          {
            status: 'shipped',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleString('en-IN'),
            location: 'Regional Sorting Facility, Mumbai',
            description: 'Package has been shipped and is in transit'
          }
        ]
      };

      setOrderData(mockData);
      setIsLoading(false);
    }, 1500);
  };

  // Calculate progress percentage based on current status
  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'processing': return 25;
      case 'shipped': return 50;
      case 'out-for-delivery': return 75;
      case 'delivered': return 100;
      case 'failed': return 100;
      default: return 0;
    }
  };

  // Get status icon based on status type
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Package className="h-5 w-5 text-amber-500" />;
      case 'shipped':
        return <TruckIcon className="h-5 w-5 text-blue-500" />;
      case 'out-for-delivery':
        return <TruckIcon className="h-5 w-5 text-indigo-600" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  // Don't render content until authentication check is complete
  if (isAuthenticated === null) {
    return <div className="flex justify-center items-center min-h-[50vh]">Loading...</div>;
  }

  // If not authenticated, we'll redirect (handled in the useEffect)
  if (isAuthenticated === false) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Helmet>
        <title>Track Your Order - Blinkeach</title>
        <meta name="description" content="Track the status and delivery of your Blinkeach order." />
      </Helmet>

      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-6">Track Your Order</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Enter Order Number</CardTitle>
          <CardDescription>
            Please enter your order number to check the status of your delivery.
            You can find your order number in your order confirmation email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <Input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g., BLK1234567"
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Tracking..." : "Track Order"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {orderData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order #{orderData.orderId}</CardTitle>
              <CardDescription>
                Tracking ID: {orderData.trackingId} • Carrier: {orderData.carrier}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Order Progress</span>
                  <span>Estimated Delivery: {orderData.estimatedDelivery}</span>
                </div>
                <Progress value={getProgressPercentage(orderData.currentStatus)} className="h-2" />
                
                <div className="flex justify-between mt-2 text-xs">
                  <span>Processing</span>
                  <span>Shipped</span>
                  <span>Out for Delivery</span>
                  <span>Delivered</span>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <h3 className="font-medium mb-4">Tracking Timeline</h3>
                <div className="space-y-4">
                  {orderData.timeline.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="mt-0.5">
                        {getStatusIcon(item.status)}
                      </div>
                      <div>
                        <div className="font-medium">{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</div>
                        <div className="text-sm text-muted-foreground">{item.date}</div>
                        {item.location && (
                          <div className="text-sm">{item.location}</div>
                        )}
                        <div className="text-sm mt-1">{item.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-6">
              <p className="text-center text-sm text-muted-foreground">
                Having issues with your delivery? <Link to="/contact-us" className="text-primary font-medium">Contact Customer Support</Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TrackOrderPage;