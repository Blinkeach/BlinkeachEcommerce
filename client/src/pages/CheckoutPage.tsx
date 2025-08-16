import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/hooks/use-auth';
import CartSummary from '@/components/cart/CartSummary';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import RazorpayPayment from '@/components/checkout/RazorpayPayment';
import { AlertCircle, ChevronLeft, Lock, ShieldCheck, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const CheckoutPage: React.FC = () => {
  const { cartItems, totalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  const [showPayment, setShowPayment] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [mockLoginEnabled, setMockLoginEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [buyNowItem, setBuyNowItem] = useState<any>(null);
  const { toast } = useToast();

  // Check if this is a "Buy Now" checkout
  const urlParams = new URLSearchParams(window.location.search);
  const isBuyNow = urlParams.get('buyNow') === 'true';

  // Handle Buy Now item loading
  useEffect(() => {
    console.log('CheckoutPage: isBuyNow =', isBuyNow); // Debug log
    if (isBuyNow) {
      const savedBuyNowItem = sessionStorage.getItem('buyNowItem');
      console.log('CheckoutPage: savedBuyNowItem =', savedBuyNowItem); // Debug log
      if (savedBuyNowItem) {
        try {
          const item = JSON.parse(savedBuyNowItem);
          console.log('CheckoutPage: parsed item =', item); // Debug log
          setBuyNowItem(item);
        } catch (error) {
          console.error('Error parsing buy now item:', error);
          toast({
            title: "Error loading product",
            description: "Please try selecting the product again.",
            variant: "destructive",
          });
          navigate('/');
        }
      } else {
        console.log('CheckoutPage: No buy now item found in session storage'); // Debug log
        toast({
          title: "No product selected",
          description: "Please select a product to purchase.",
          variant: "destructive",
        });
        navigate('/');
      }
    }
  }, [isBuyNow, navigate, toast]);

  // Filter out-of-stock items and redirect if cart is empty
  useEffect(() => {
    // Skip this check if it's a buy now checkout
    if (isBuyNow) return;
    
    // Filter for in-stock items only
    const inStockItems = cartItems.filter(item => item.product?.stock > 0);
    
    // If we have out-of-stock items in the cart but the user proceeded anyway
    if (inStockItems.length < cartItems.length) {
      const outOfStockItems = cartItems.filter(item => item.product?.stock <= 0);
      const itemNames = outOfStockItems.map(item => item.product.name);
      
      toast({
        title: "Some items are unavailable",
        description: `The following items are out of stock and will not be included in your order: ${itemNames.join(', ')}`,
        duration: 5000
      });
    }
    
    // Redirect to cart if all items are out of stock
    if (inStockItems.length === 0) {
      toast({
        title: "All items are out of stock",
        description: "Please add some available products to your cart.",
        variant: "destructive", 
        duration: 5000
      });
      navigate('/cart');
    }
  }, [cartItems, navigate, toast, isBuyNow]);

  // Additional check for buy now items - redirect if no valid buy now item
  useEffect(() => {
    if (isBuyNow && !buyNowItem) {
      const timeoutId = setTimeout(() => {
        toast({
          title: "Invalid purchase",
          description: "Please select a product to purchase.",
          variant: "destructive",
          duration: 3000
        });
        navigate('/');
      }, 1000); // Give some time for the item to load

      return () => clearTimeout(timeoutId);
    }
  }, [isBuyNow, buyNowItem, navigate, toast]);

  const handleCheckoutSubmit = (values: any) => {
    console.log("Checkout form submitted with values:", values);
    setFormData(values);
    
    // Track the selected payment method
    setPaymentMethod(values.paymentMethod);
    
    if (values.paymentMethod === 'cod') {
      // For COD, process order directly without payment gateway
      handleCashOnDeliveryOrder(values);
    } else {
      // For Razorpay, show payment component
      setShowPayment(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Handle COD order creation
  const handleCashOnDeliveryOrder = async (values: any) => {
    try {
      // Set submission state to prevent multiple clicks
      setIsSubmitting(true);
      console.log("Processing COD order with values:", values);
      
      // Prepare address string that includes all address details
      const fullAddress = `${values.name}, ${values.phone}, ${values.address}, ${values.city}, ${values.state} - ${values.pincode}`;
      console.log("Full address:", fullAddress);
      
      let orderData;
      
      if (isBuyNow && buyNowItem) {
        // Buy Now order: use the single item from sessionStorage
        const itemPrice = buyNowItem.product?.price || buyNowItem.price || 0;
        const subtotal = itemPrice * buyNowItem.quantity;
        const gst = subtotal * 0.18;
        const deliveryCharge = 40;
        const deliveryDiscount = subtotal > 499 ? deliveryCharge : 0;
        const finalDeliveryCharge = deliveryCharge - deliveryDiscount;
        const totalAmount = subtotal + gst + finalDeliveryCharge;
        
        console.log("Buy Now item details:", {
          buyNowItem,
          itemPrice,
          subtotal,
          gst,
          deliveryCharge,
          deliveryDiscount,
          finalDeliveryCharge,
          totalAmount
        });
        
        orderData = {
          userId: user?.id || 1,
          totalAmount: Math.round(totalAmount),
          shippingAddress: fullAddress,
          specialInstructions: values.specialInstructions || '',
          items: [{
            productId: buyNowItem.productId || buyNowItem.id,
            name: buyNowItem.product?.name || buyNowItem.name,
            price: itemPrice,
            quantity: buyNowItem.quantity,
            selectedColor: buyNowItem.selectedColor,
            selectedSize: buyNowItem.selectedSize
          }]
        };
      } else {
        // Regular cart checkout: use cart items
        const inStockItems = cartItems.filter(item => item.product?.stock > 0);
        
        const subtotal = inStockItems.reduce((sum, item) => {
          const itemPrice = item.product?.discountedPrice || item.product?.price || 0;
          return sum + (itemPrice * item.quantity);
        }, 0);
        
        const gst = subtotal * 0.18;
        const deliveryCharge = 40;
        const deliveryDiscount = subtotal > 499 ? deliveryCharge : 0;
        const finalDeliveryCharge = deliveryCharge - deliveryDiscount;
        const totalAmount = subtotal + gst + finalDeliveryCharge;
        
        orderData = {
          userId: user?.id || 1,
          totalAmount: Math.round(totalAmount),
          shippingAddress: fullAddress,
          specialInstructions: values.specialInstructions || '',
          items: inStockItems.map(item => ({
            productId: item.productId,
            name: item.product.name,
            price: item.product.discountedPrice || item.product.price,
            quantity: item.quantity,
            selectedColor: item.selectedColor,
            selectedSize: item.selectedSize
          }))
        };
      }
      
      console.log("Sending request to /api/payment/process-cod with data:", orderData);
      
      // Create the order with COD payment method using our dedicated endpoint
      const response = await fetch('/api/payment/process-cod', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Error response:", errorData);
        throw new Error(errorData?.message || 'Failed to create order');
      }
      
      const order = await response.json();
      console.log("Order created successfully:", order);
      
      // Show success message
      toast({
        title: "Order Placed Successfully",
        description: "Your Cash on Delivery order has been confirmed!",
        duration: 5000
      });
      
      // Clear cart and navigate to success page
      clearCart();
      navigate('/order-confirmation?orderId=' + order.orderId + '&paymentMethod=cod');
      
    } catch (error) {
      console.error('Error creating COD order:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      // Show error message to user with toast
      toast({
        title: "Order Creation Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      });
    } finally {
      // Reset submitting state regardless of outcome
      setIsSubmitting(false);
    }
  };

  // Don't redirect if this is a buy now checkout with a valid item
  if (cartItems.length === 0 && !isBuyNow) {
    return null; // Will redirect in useEffect
  }

  // For buy now, wait for the item to be loaded
  if (isBuyNow && !buyNowItem) {
    return null; // Will redirect in useEffect if no buy now item
  }

  return (
    <>
      <Helmet>
        <title>Checkout - Blinkeach</title>
        <meta name="description" content="Complete your purchase securely with our easy checkout process." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/cart">
            <a className="text-secondary hover:underline flex items-center text-sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Cart
            </a>
          </Link>
          <h1 className="text-2xl font-bold text-neutral-800 mt-2">Checkout</h1>
        </div>

        {/* Authentication Warning */}
        {!isAuthenticated && !mockLoginEnabled && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              You need to be logged in to complete checkout. For testing purposes, you can 
              <Button 
                variant="link" 
                className="p-0 h-auto font-semibold text-primary" 
                onClick={() => {
                  // Create fake auth token
                  localStorage.setItem('auth_token', 'test_token_for_demo');
                  setMockLoginEnabled(true);
                  toast({
                    title: "Test Mode Enabled",
                    description: "You are now in test mode for checkout. This is not a real login.",
                    duration: 3000
                  });
                }}
              >
                &nbsp;enable test mode
              </Button>.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Security Banner */}
        <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-6 flex items-center">
          <Lock className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
          <p className="text-green-800 text-sm">
            <span className="font-medium">Secure Checkout:</span> Your payment information is encrypted and secure.
            {mockLoginEnabled && <span className="ml-1 bg-amber-200 text-amber-800 px-1 py-0.5 text-xs rounded">TEST MODE</span>}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Checkout Form or Payment */}
          <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
            {showPayment ? (
              <RazorpayPayment orderDetails={formData} />
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-4">Shipping & Payment Details</h2>
                <CheckoutForm 
                  onSubmit={handleCheckoutSubmit} 
                  isSubmitting={isSubmitting}
                  onPaymentMethodChange={setPaymentMethod}
                />
              </>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:w-80">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              {/* Show Buy Now item or regular cart items */}
              {isBuyNow && buyNowItem ? (
                <div className="mb-4 p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <img 
                      src={buyNowItem.product.image} 
                      alt={buyNowItem.product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{buyNowItem.product.name}</h3>
                      <p className="text-sm text-gray-600">Qty: {buyNowItem.quantity}</p>
                      {buyNowItem.selectedColor && (
                        <p className="text-xs text-gray-500">Color: {buyNowItem.selectedColor}</p>
                      )}
                      {buyNowItem.selectedSize && (
                        <p className="text-xs text-gray-500">Size: {buyNowItem.selectedSize}</p>
                      )}
                      <p className="text-sm font-medium">₹{(buyNowItem.product.price / 100).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <CartSummary showCheckoutButton={false} />
              )}
              
              <div className="space-y-3 mt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₹{isBuyNow && buyNowItem 
                    ? ((buyNowItem.product.price * buyNowItem.quantity) / 100).toLocaleString('en-IN')
                    : (totalPrice / 100).toLocaleString('en-IN')
                  }</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>GST (18%):</span>
                  <span>₹{(() => {
                    const subtotal = isBuyNow && buyNowItem 
                      ? (buyNowItem.product.price * buyNowItem.quantity) / 100
                      : totalPrice / 100;
                    const gst = subtotal * 0.18;
                    return gst.toLocaleString('en-IN', { minimumFractionDigits: 2 });
                  })()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Delivery Charge:</span>
                  <span>₹40.00</span>
                </div>

                <div className="flex justify-between text-sm text-green-600">
                  <span>Universal Discount:</span>
                  <span>-₹40.00</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Final Shipping:</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                
                {/* Discount Calculation Section */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                  <div className="text-xs font-semibold text-amber-800 mb-1">Discount Calculation:</div>
                  <div className="text-xs text-amber-700 leading-relaxed">
                    {(() => {
                      const subtotal = isBuyNow && buyNowItem 
                        ? (buyNowItem.product.price * buyNowItem.quantity) / 100
                        : totalPrice / 100;
                      const gst = subtotal * 0.18;
                      const deliveryCharge = 40;
                      const universalDiscount = 40;
                      const totalBeforeDiscount = subtotal + deliveryCharge + gst;
                      const total = totalBeforeDiscount - universalDiscount;
                      
                      return (
                        <>
                          Total Before Discount: ₹{totalBeforeDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}<br />
                          Less: Universal Discount: -₹{universalDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}<br />
                          <span className="font-semibold">Final Total: ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="border-t border-neutral-200 pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>
                      {(() => {
                        const subtotal = isBuyNow && buyNowItem 
                          ? (buyNowItem.product.price * buyNowItem.quantity) / 100
                          : totalPrice / 100;
                        const gst = subtotal * 0.18;
                        const deliveryCharge = 40;
                        const universalDiscount = 40;
                        const totalBeforeDiscount = subtotal + deliveryCharge + gst;
                        const total = totalBeforeDiscount - universalDiscount;
                        
                        return `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Order Benefits */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-4 space-y-4">
              <h3 className="font-medium mb-2">Order Benefits</h3>
              
              <div className="flex items-start">
                <ShieldCheck className="h-5 w-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">100% Secure Payments</p>
                  <p className="text-xs text-neutral-500">All major credit & debit cards accepted</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Truck className="h-5 w-5 text-secondary mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Free Delivery</p>
                  <p className="text-xs text-neutral-500">3-7 business days nationwide</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <div>
                  <p className="text-sm font-medium">7-Day Returns</p>
                  <p className="text-xs text-neutral-500">Easy returns on all products</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items Summary */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Items in Your Order</h2>
          <div className="divide-y">
            {cartItems.map((item) => (
              <div key={item.id} className="py-4 flex items-center">
                <div className="w-16 h-16 bg-white p-2 rounded border border-neutral-200 mr-4 flex-shrink-0">
                  <img 
                    src={item.product.image} 
                    alt={item.product.name} 
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-neutral-800 line-clamp-2">
                    {item.product.name}
                  </h3>
                  <p className="text-xs text-neutral-500">Quantity: {item.quantity}</p>
                </div>
                <div className="font-medium text-sm">
                  ₹{((item.product.discountedPrice || item.product.price) * item.quantity / 100).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
          
          {/* Payment Options Advertisement */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="text-blue-800 font-medium text-sm mb-2">Payment Options</h3>
            <ul className="space-y-2 text-xs text-blue-700">
              <li className="flex items-start">
                <span className="inline-block w-4 h-4 bg-blue-100 rounded-full text-blue-600 flex items-center justify-center mr-2 mt-0.5 text-xs">₹</span>
                <span>Cash on Delivery - Pay when your order arrives (₹10 handling fee applies)</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-4 h-4 bg-green-100 rounded-full text-green-600 flex items-center justify-center mr-2 mt-0.5 text-xs">%</span>
                <span>Razorpay - Get 1% discount on orders below ₹1,000 and 5% discount on orders ₹1,000 and above</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
