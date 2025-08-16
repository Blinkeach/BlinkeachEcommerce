import { format } from "date-fns";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import logoPath from "@assets/WhatsApp Image 2025-04-14 at 13.50.21_0b4e25ae_1747811595131.jpg";

// Enhanced types for better invoice generation
interface InvoiceOrderItem {
  id: number;
  orderId: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  selectedColor?: string | null;
  selectedSize?: string | null;
  hsnCode?: string | null;
  productImage?: string | null;
  productName?: string;
}

interface InvoiceOrder {
  id: number;
  userId: number;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  shippingAddress: string;
  trackingId?: string;
  items: (
    | InvoiceOrderItem
    | {
        id: number;
        orderId: number;
        productId: number;
        quantity: number;
        price: number;
        productName: string;
        productImage?: string;
        name?: string;
        selectedColor?: string | null;
        selectedSize?: string | null;
        hsnCode?: string | null;
      }
  )[];
}

// Generate QR code for order tracking
const generateQRCode = (text: string): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(text)}`;
};

// Extract customer info from shipping address
const parseCustomerInfo = (shippingAddress: string) => {
  const parts = shippingAddress.split(",").map((part) => part.trim());
  const phoneMatch = shippingAddress.match(/(\d{10})/);

  return {
    name: parts[0] || "Valued Customer",
    phone: phoneMatch ? phoneMatch[1] : "N/A",
    address: parts.slice(1).join(", ") || shippingAddress,
  };
};

// Modern invoice generator with enhanced UI/UX
export const generateModernInvoice = async (
  order: InvoiceOrder,
): Promise<void> => {
  try {
    console.log("Generating modern invoice for order:", order.id);

    // Create invoice element
    const invoiceElement = document.createElement("div");
    invoiceElement.style.position = "absolute";
    invoiceElement.style.left = "-9999px";
    invoiceElement.style.top = "-9999px";
    document.body.appendChild(invoiceElement);

    // Generate invoice data
    const orderDate = new Date(order.createdAt);
    const invoiceDate = new Date();
    const invoiceNumber = `BLK${order.id.toString().padStart(6, "0")}`;
    const customer = parseCustomerInfo(order.shippingAddress);
    const trackingUrl = `https://blinkeach.com/orders/${order.id}`;
    const qrCodeUrl = generateQRCode(trackingUrl);

    // Calculate totals
    let subtotal = 0;
    order.items.forEach((item) => {
      subtotal += (item.price * item.quantity) / 100;
    });

    const tax = subtotal * 0.18; // 18% GST
    const shipping = subtotal > 499 ? 0 : 99;
    const total = subtotal + tax + shipping;

    // Modern invoice HTML with enhanced styling
    invoiceElement.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .modern-invoice {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          background: #ffffff;
          color: #1a1a1a;
          line-height: 1.6;
          position: relative;
        }
        
        .invoice-header {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          padding: 40px 40px 60px;
          position: relative;
          overflow: hidden;
        }
        
        .invoice-header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          border-radius: 50%;
        }
        
        .header-content {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .company-info h1 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .company-info p {
          font-size: 16px;
          opacity: 0.9;
          font-weight: 300;
        }
        
        .invoice-meta {
          text-align: right;
        }
        
        .invoice-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        
        .invoice-number {
          font-size: 18px;
          font-weight: 500;
          opacity: 0.9;
        }
        
        .invoice-body {
          padding: 0 40px 40px;
        }
        
        .info-section {
          background: #f8fafc;
          margin: -30px 0 40px;
          padding: 30px;
          border-radius: 16px;
          position: relative;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 30px;
          margin-bottom: 20px;
        }
        
        .info-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }
        
        .info-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.15);
        }
        
        .info-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        
        .info-value {
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
          line-height: 1.5;
        }
        
        .qr-section {
          text-align: center;
          padding: 20px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        
        .qr-code {
          width: 100px;
          height: 100px;
          border-radius: 8px;
          margin-bottom: 12px;
        }
        
        .qr-text {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }
        
        .items-section {
          margin: 40px 0;
        }
        
        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #6366f1;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .items-table thead {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
        }
        
        .items-table th {
          padding: 16px 20px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .items-table td {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
        }
        
        .items-table tbody tr:hover {
          background: #f8fafc;
        }
        
        .items-table tbody tr:last-child td {
          border-bottom: none;
        }
        
        .product-info {
          display: flex;
          flex-direction: column;
        }
        
        .product-name {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 4px;
        }
        
        .product-details {
          font-size: 12px;
          color: #64748b;
        }
        
        .amount-cell {
          text-align: right;
          font-weight: 600;
          color: #1e293b;
        }
        
        .summary-section {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 30px;
          border-radius: 16px;
          margin-top: 40px;
        }
        
        .summary-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .summary-grid {
          display: grid;
          gap: 12px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        
        .summary-row.total {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          font-weight: 700;
          font-size: 16px;
          margin-top: 12px;
        }
        
        .summary-label {
          font-weight: 500;
          color: #64748b;
        }
        
        .summary-value {
          font-weight: 600;
          color: #1e293b;
        }
        
        .footer-section {
          background: #1e293b;
          color: white;
          padding: 30px 40px;
          text-align: center;
          margin-top: 40px;
        }
        
        .footer-content {
          max-width: 600px;
          margin: 0 auto;
        }
        
        .footer-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        
        .footer-text {
          font-size: 14px;
          opacity: 0.8;
          line-height: 1.6;
        }
        
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .status-delivered {
          background: #dcfce7;
          color: #166534;
        }
        
        .status-shipped {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .status-processing {
          background: #fef3c7;
          color: #92400e;
        }
        
        .status-pending {
          background: #fee2e2;
          color: #991b1b;
        }
        
        @media print {
          .modern-invoice {
            max-width: none;
            margin: 0;
          }
          .invoice-header, .items-table thead {
            background: #6366f1 !important;
            color: white !important;
          }
        }
        
        @media (max-width: 768px) {
          .invoice-header, .invoice-body, .footer-section {
            padding-left: 20px;
            padding-right: 20px;
          }
          .info-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .header-content {
            flex-direction: column;
            gap: 20px;
          }
          .invoice-meta {
            text-align: left;
          }
          .items-table {
            font-size: 12px;
          }
          .items-table th, .items-table td {
            padding: 12px 16px;
          }
        }
      </style>
      
      <div class="modern-invoice">
        <!-- Header Section -->
        <div class="invoice-header">
          <div class="header-content">
            <div class="company-info">
              <h1>Blinkeach</h1>
              <p>Premium E-commerce Experience</p>
            </div>
            <div class="invoice-meta">
              <div class="invoice-title">Tax Invoice</div>
              <div class="invoice-number">#${invoiceNumber}</div>
            </div>
          </div>
        </div>
        
        <!-- Body Section -->
        <div class="invoice-body">
          <!-- Info Section -->
          <div class="info-section">
            <div class="info-grid">
              <div class="info-card">
                <div class="info-label">Order Details</div>
                <div class="info-value">
                  Order ID: #${order.id}<br>
                  Order Date: ${format(orderDate, "dd MMM yyyy")}<br>
                  Status: <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
                </div>
              </div>
              
              <div class="info-card">
                <div class="info-label">Bill To</div>
                <div class="info-value">
                  ${customer.name}<br>
                  ${customer.address}<br>
                  Phone: ${customer.phone}
                </div>
              </div>
              
              <div class="qr-section">
                <img src="${qrCodeUrl}" alt="Track Order" class="qr-code" crossorigin="anonymous">
                <div class="qr-text">Scan to track your order</div>
              </div>
            </div>
            
            <div class="info-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 0;">
              <div class="info-card">
                <div class="info-label">Ship From</div>
                <div class="info-value">
                  Blinkeach <br>
                  Ground Floor, GN0320781 KB Lane<br>
                  Near Yusuf Masjid, Gaya<br>
                  Bihar, India - 823001<br>
                  GSTIN: 10BSIPA2544N1Z0
                </div>
              </div>
              
              <div class="info-card">
                <div class="info-label">Invoice Details</div>
                <div class="info-value">
                  Invoice Date: ${format(invoiceDate, "dd MMM yyyy")}<br>
                  Payment Method: ${order.paymentMethod.toUpperCase()}<br>
                  ${order.trackingId ? `Tracking ID: ${order.trackingId}` : ""}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Items Section -->
          <div class="items-section">
            <h2 class="section-title">Order Items</h2>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>HSN Code</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items
                  .map((item) => {
                    const unitPrice = item.price / 100;
                    const totalPrice = (item.price * item.quantity) / 100;
                    const productDetails = [];

                    // Handle both new and old item formats
                    const itemName = item.name || item.productName || "Product";
                    const itemColor = item.selectedColor || "";
                    const itemSize = item.selectedSize || "";
                    const itemHsn = item.hsnCode || "61149090";

                    if (itemColor) productDetails.push(`Color: ${itemColor}`);
                    if (itemSize) productDetails.push(`Size: ${itemSize}`);

                    return `
                    <tr>
                      <td>
                        <div class="product-info">
                          <div class="product-name">${itemName}</div>
                          ${productDetails.length > 0 ? `<div class="product-details">${productDetails.join(" • ")}</div>` : ""}
                        </div>
                      </td>
                      <td>${itemHsn}</td>
                      <td style="text-align: center;">${item.quantity}</td>
                      <td class="amount-cell">₹${unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td class="amount-cell">₹${totalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
          
          <!-- Summary Section -->
          <div class="summary-section">
            <h3 class="summary-title">Payment Summary</h3>
            <div class="summary-grid">
              <div class="summary-row">
                <span class="summary-label">Subtotal</span>
                <span class="summary-value">₹${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">GST (18%)</span>
                <span class="summary-value">₹${tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Shipping</span>
                <span class="summary-value">${shipping === 0 ? "Free" : `₹${shipping.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}</span>
              </div>
              <div class="summary-row total">
                <span>Total Amount</span>
                <span>₹${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Footer Section -->
        <div class="footer-section">
          <div class="footer-content">
            <h3 class="footer-title">Thank You for Shopping with Blinkeach!</h3>
            <p class="footer-text">
              For any queries regarding your order, please contact our customer support at support@blinkeach.com or call 8709144545.
              Visit us at www.blinkeach.com for more amazing products.
            </p>
          </div>
        </div>
      </div>
    `;

    // Generate PDF
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
    });

    // Create PDF
    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save PDF
    pdf.save(`Blinkeach_Invoice_${invoiceNumber}.pdf`);

    // Clean up
    document.body.removeChild(invoiceElement);

    console.log("Modern invoice generated successfully");
  } catch (error) {
    console.error("Error generating modern invoice:", error);
    throw error;
  }
};
