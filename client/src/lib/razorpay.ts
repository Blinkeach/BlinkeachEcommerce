import { apiRequest } from './queryClient';

export interface OrderDetails {
  id: number;
  amount: number;
  currency: string;
  orderId: string;
  userEmail: string;
  userPhone: string;
  userName: string;
  address: string;
  userId: number;
  totalAmount: number;
  shippingAddress: string;
  paymentMethod: string;
  specialInstructions?: string;
  items: Array<{
    id: number;
    productId: number;
    name: string;
    price: number;
    quantity: number;
  }>;
}

export async function createRazorpayOrder(orderDetails: OrderDetails): Promise<{ id: string }> {
  try {
    const response = await apiRequest('POST', '/api/payment/create-order', orderDetails);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error('Failed to create payment order');
  }
}

export async function verifyPayment(paymentData: {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  orderId: string | number;
}): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiRequest('POST', '/api/payment/verify', paymentData);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw new Error('Failed to verify payment');
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: {
    address: string;
  };
  theme: {
    color: string;
  };
  handler: (response: any) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function initiateRazorpayPayment(options: RazorpayOptions): void {
  console.log('Initializing Razorpay with options:', options);
  
  if (!window.Razorpay) {
    console.error('Razorpay script not loaded');
    throw new Error('Razorpay script not loaded');
  }
  
  try {
    const razorpay = new window.Razorpay({
      ...options,
      modal: {
        ondismiss: function() {
          console.log('Razorpay payment modal dismissed');
        }
      }
    });
    
    console.log('Opening Razorpay payment modal');
    razorpay.open();
  } catch (error) {
    console.error('Error initializing Razorpay:', error);
    throw error;
  }
}
