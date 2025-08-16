import { Order } from '@shared/schema';
import { sendGmailEmail } from './gmail';

const FROM_EMAIL = 'noreply@blinkeach.com';
const COMPANY_NAME = 'Blinkeach';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Format date safely handling null/undefined values
 */
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
}

/**
 * Send an email using Gmail
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  return sendGmailEmail(
    options.to,
    options.subject,
    options.text,
    options.html
  );
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(order: Order, email: string, customerName: string, trackingInfo?: { trackingId: string, trackingUrl: string }): Promise<boolean> {
  const subject = `Your ${COMPANY_NAME} Order #${order.id} Confirmation`;
  const orderDate = formatDate(order.createdAt);
  
  // Tracking information section
  const trackingSection = trackingInfo ? `
    <div style="margin-top: 20px; padding: 15px; background-color: #f7f7f7; border-radius: 5px;">
      <h3 style="margin-top: 0;">Tracking Information</h3>
      <p><strong>Tracking ID:</strong> ${trackingInfo.trackingId}</p>
      <p>You can track your package's journey in real-time <a href="${trackingInfo.trackingUrl}" style="color: #1F51A9;" target="_blank">here</a>.</p>
    </div>
  ` : '';
  
  const trackingTextSection = trackingInfo ? `
    Tracking Information
    Tracking ID: ${trackingInfo.trackingId}
    Track your package in real-time at: ${trackingInfo.trackingUrl}
    
  ` : '';
  
  // Generate HTML email body
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1F51A9; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Order Confirmation</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e1e1e1; border-top: none;">
        <p>Hello ${customerName},</p>
        <p>Thank you for your order! We've received your order and are working on it.</p>
        <h2 style="margin-top: 30px;">Order Details</h2>
        <p><strong>Order Number:</strong> #${order.id}</p>
        <p><strong>Order Date:</strong> ${orderDate}</p>
        <p><strong>Order Status:</strong> ${order.status}</p>
        <p><strong>Total Amount:</strong> ₹${order.totalAmount.toLocaleString('en-IN')}</p>
        
        ${trackingSection}
        
        <div style="margin-top: 30px;">
          <p>You can view your complete order history by visiting your <a href="https://blinkeach.com/orders" style="color: #1F51A9;">account dashboard</a>.</p>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e1e1e1; font-size: 12px; color: #777;">
          <p>If you have any questions, please contact our customer support.</p>
          <p>© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
  
  // Plain text version
  const text = `
    Order Confirmation
    
    Hello ${customerName},
    
    Thank you for your order! We've received your order and are working on it.
    
    Order Details
    Order Number: #${order.id}
    Order Date: ${orderDate}
    Order Status: ${order.status}
    Total Amount: ₹${order.totalAmount.toLocaleString('en-IN')}
    
    ${trackingTextSection}
    
    You can view your complete order history by visiting your account dashboard at https://blinkeach.com/orders.
    
    If you have any questions, please contact our customer support.
    
    © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
  `;
  
  return sendEmail({
    to: email,
    subject,
    text,
    html
  });
}

/**
 * Send order status update email
 */
export async function sendOrderStatusUpdate(
  order: Order, 
  email: string, 
  customerName: string, 
  trackingInfo?: { trackingId: string, trackingUrl: string }
): Promise<boolean> {
  const subject = `Your ${COMPANY_NAME} Order #${order.id} Status Update`;
  const orderDate = formatDate(order.createdAt);
  
  // Generate status-specific message
  let statusMessage = '';
  let showReviewRequest = false;
  
  switch (order.status) {
    case 'processing':
      statusMessage = 'Your order is now being processed. We\'ll update you when it ships.';
      break;
    case 'shipped':
      statusMessage = 'Your order has been shipped! You can expect delivery within 3-5 business days.';
      break;
    case 'delivered':
      statusMessage = 'Your order has been delivered. We hope you enjoy your purchase!';
      showReviewRequest = true;
      break;
    case 'cancelled':
      statusMessage = 'Your order has been cancelled as requested. If you have any questions, please contact customer support.';
      break;
    default:
      statusMessage = `Your order status has been updated to "${order.status}".`;
  }
  
  // Tracking information section
  const trackingSection = trackingInfo ? `
    <div style="margin-top: 20px; padding: 15px; background-color: #f7f7f7; border-radius: 5px;">
      <h3 style="margin-top: 0;">Tracking Information</h3>
      <p><strong>Tracking ID:</strong> ${trackingInfo.trackingId}</p>
      <p>You can track your package's journey in real-time <a href="${trackingInfo.trackingUrl}" style="color: #1F51A9;" target="_blank">here</a>.</p>
    </div>
  ` : '';
  
  const trackingTextSection = trackingInfo ? `
    Tracking Information
    Tracking ID: ${trackingInfo.trackingId}
    Track your package in real-time at: ${trackingInfo.trackingUrl}
    
  ` : '';
  
  // Review request section for delivered orders
  const reviewSection = showReviewRequest ? `
    <div style="margin-top: 25px; padding: 15px; background-color: #f9f3e8; border-radius: 5px; border-left: 4px solid #f5a623;">
      <h3 style="margin-top: 0; color: #333;">Share Your Feedback</h3>
      <p>We'd love to hear about your experience with your purchase. Your feedback helps us improve and assists other customers.</p>
      <div style="text-align: center; margin-top: 15px;">
        <a href="https://blinkeach.com/review-order/${order.id}" style="background-color: #f5a623; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
          Write a Review
        </a>
      </div>
    </div>
  ` : '';
  
  const reviewTextSection = showReviewRequest ? `
    Share Your Feedback
    We'd love to hear about your experience with your purchase. Your feedback helps us improve and assists other customers.
    Write a review at: https://blinkeach.com/review-order/${order.id}
    
  ` : '';
  
  // Generate HTML email body
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1F51A9; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Order Status Update</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e1e1e1; border-top: none;">
        <p>Hello ${customerName},</p>
        <p>${statusMessage}</p>
        <h2 style="margin-top: 30px;">Order Details</h2>
        <p><strong>Order Number:</strong> #${order.id}</p>
        <p><strong>Order Date:</strong> ${orderDate}</p>
        <p><strong>Current Status:</strong> ${order.status}</p>
        
        ${trackingSection}
        ${reviewSection}
        
        <div style="margin-top: 30px;">
          <p>You can view your complete order and all updates by visiting your <a href="https://blinkeach.com/orders" style="color: #1F51A9;">account dashboard</a>.</p>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e1e1e1; font-size: 12px; color: #777;">
          <p>If you have any questions, please contact our customer support.</p>
          <p>© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
  
  // Plain text version
  const text = `
    Order Status Update
    
    Hello ${customerName},
    
    ${statusMessage}
    
    Order Details
    Order Number: #${order.id}
    Order Date: ${orderDate}
    Current Status: ${order.status}
    
    ${trackingTextSection}
    ${reviewTextSection}
    
    You can view your complete order and all updates by visiting your account dashboard at https://blinkeach.com/orders.
    
    If you have any questions, please contact our customer support.
    
    © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
  `;
  
  return sendEmail({
    to: email,
    subject,
    text,
    html
  });
}

/**
 * Send review request email
 */
export async function sendReviewRequest(order: Order, email: string, customerName: string): Promise<boolean> {
  const subject = `Share Your Thoughts on Your Recent ${COMPANY_NAME} Purchase`;
  const orderDate = formatDate(order.createdAt);
  
  // Generate HTML email body
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1F51A9; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">How Was Your Purchase?</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e1e1e1; border-top: none;">
        <p>Hello ${customerName},</p>
        <p>Thank you for shopping with ${COMPANY_NAME}! We hope you're enjoying your recent purchase.</p>
        <p>Your feedback helps other customers make informed decisions and helps us improve our products and services.</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="https://blinkeach.com/review-order/${order.id}" style="background-color: #1F51A9; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
            Rate & Review Your Purchase
          </a>
        </div>
        
        <p>This will only take a minute of your time and would be greatly appreciated!</p>
        
        <div style="margin-top: 30px;">
          <h3>Order Details</h3>
          <p><strong>Order Number:</strong> #${order.id}</p>
          <p><strong>Order Date:</strong> ${orderDate}</p>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e1e1e1; font-size: 12px; color: #777;">
          <p>If you have any questions or concerns about your order, please contact our customer support.</p>
          <p>© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
  
  // Plain text version
  const text = `
    How Was Your Purchase?
    
    Hello ${customerName},
    
    Thank you for shopping with ${COMPANY_NAME}! We hope you're enjoying your recent purchase.
    
    Your feedback helps other customers make informed decisions and helps us improve our products and services.
    
    Please rate and review your purchase by visiting: https://blinkeach.com/review-order/${order.id}
    
    This will only take a minute of your time and would be greatly appreciated!
    
    Order Details
    Order Number: #${order.id}
    Order Date: ${orderDate}
    
    If you have any questions or concerns about your order, please contact our customer support.
    
    © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
  `;
  
  return sendEmail({
    to: email,
    subject,
    text,
    html
  });
}

/**
 * Send OTP verification email
 */
export async function sendOTPVerificationEmail(email: string, otp: string): Promise<boolean> {
  const subject = `Your ${COMPANY_NAME} Verification Code`;
  
  // Generate HTML email body
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1F51A9; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Verification Code</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e1e1e1; border-top: none; text-align: center;">
        <p>Hello,</p>
        <p>Your verification code for ${COMPANY_NAME} is:</p>
        <div style="margin: 30px 0; background-color: #f8f8f8; padding: 20px; font-size: 32px; letter-spacing: 5px; font-weight: bold;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e1e1e1; font-size: 12px; color: #777;">
          <p>© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
  
  // Plain text version
  const text = `
    Verification Code
    
    Hello,
    
    Your verification code for ${COMPANY_NAME} is: ${otp}
    
    This code will expire in 10 minutes.
    
    If you didn't request this code, please ignore this email.
    
    © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
  `;
  
  return sendEmail({
    to: email,
    subject,
    text,
    html
  });
}