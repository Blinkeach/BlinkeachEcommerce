import { format } from "date-fns";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import logoPath from "@assets/WhatsApp Image 2025-04-14 at 13.50.21_0b4e25ae_1747811595131.jpg";

// Invoice-specific types to handle database field names
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
  createdAt: string;
  updatedAt: string;
}

// Function to generate QR code data URL
const generateQRCode = (text: string): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(text)}`;
};

// Interface for order and order item
interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;

  productName: string;
  productImage?: string;
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
  items: OrderItem[];
}

interface InvoiceOrder extends Omit<Order, "items"> {
  items: InvoiceOrderItem[];
}

export const createPDF = async (order: Order): Promise<void> => {
  try {
    console.log("Starting invoice generation for order:", order?.id);

    // Validation
    if (!order || !order.id || !Array.isArray(order.items)) {
      throw new Error("Invalid order data");
    }

    // Format dates
    let dateCreated, dateGenerated;
    try {
      dateCreated = format(new Date(order.createdAt), "dd MMM yyyy");
      dateGenerated = format(new Date(), "dd MMM yyyy");
    } catch (err) {
      dateCreated = "N/A";
      dateGenerated = format(new Date(), "dd MMM yyyy");
    }

    // Calculate total amount (divide by 100 since it's stored in paise)
    const totalAmount =
      typeof order.totalAmount === "number" ? order.totalAmount : 0;
    const convertedTotal = totalAmount / 100;

    // Create a temporary HTML invoice
    const invoiceHtml = document.createElement("div");
    invoiceHtml.style.width = "800px";
    invoiceHtml.style.padding = "40px";
    invoiceHtml.style.fontFamily = "Arial, sans-serif";
    invoiceHtml.style.color = "#212121";
    invoiceHtml.style.position = "absolute";
    invoiceHtml.style.left = "-9999px";
    invoiceHtml.style.background = "white";

    // Create unique invoice number based on order creation date (remains consistent across downloads)
    const orderDate = new Date(order.createdAt);
    const invoiceNumber = `BLK${order.id}${format(orderDate, "yyyyMMdd")}`;
    const orderTrackingUrl = `https://blinkeach.com/orders?id=${order.id}`;
    const qrCodeUrl = generateQRCode(orderTrackingUrl);

    // Parse shipping address to extract name and phone
    let customerName = "Customer";
    let customerPhone = "N/A";
    try {
      const addressParts = order.shippingAddress.split(",");
      if (addressParts.length > 0) {
        customerName = addressParts[0].trim();
      }
      // Try to extract phone from address if available
      const phoneMatch = order.shippingAddress.match(/(\d{10})/);
      if (phoneMatch) {
        customerPhone = phoneMatch[1];
      }
    } catch (e) {
      console.log("Error parsing address:", e);
    }

    // Professional invoice layout with responsive design
    invoiceHtml.innerHTML = `
      <style>
        .table-container { 
          overflow-x: auto; 
          margin-bottom: 20px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
        }
        table { 
          width: 100%; 
          min-width: 900px; 
          border-collapse: collapse; 
          font-size: 10px; 
        }
        table th, table td { 
          padding: 6px; 
          border: 1px solid #000; 
          white-space: nowrap;
        }
        table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .product-cell {
          white-space: normal !important;
          max-width: 200px;
        }
        @media (max-width: 600px) {
          table { 
            min-width: 800px;
            font-size: 8px; 
          }
          table th, table td { 
            padding: 4px; 
            font-size: 7px; 
          }
          .invoice-container {
            padding: 15px !important;
            font-size: 9px !important;
          }
          .product-cell {
            max-width: 150px;
          }
        }
      </style>
      <div class="invoice-container" style="width: 100%; max-width: 800px; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #000;">
        
        <!-- Header with Tax Invoice title -->
        <div style="text-align: right; margin-bottom: 20px;">
          <h1 style="font-size: 18px; font-weight: bold; margin: 0;">Tax Invoice</h1>
        </div>
        
        <!-- Company details and invoice info -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
          <div style="flex: 2;">
            <div style="margin-bottom: 15px;">
              <img src="${logoPath}" alt="Blinkeach Logo" style="height: 40px; width: auto;" onerror="this.style.display='none'">
            </div>
            <div style="font-size: 11px; line-height: 1.3;">
              <strong>Sold By: Blinkeach</strong><br>
              <strong>Ship-from Address:</strong> Ground Floor House No GN0320781 KB Lane Near Yusuf Masjid<br>
              Panchaiti Akhara Gaya, Bihar, India - 823001, IN-BR<br>
              <strong>GSTIN:</strong> 10BSIPA2544N1Z0
            </div>
          </div>
          <div style="text-align: right; flex: 1;">
            <div style="margin-bottom: 15px;">
              <img src="${qrCodeUrl}" alt="QR Code" style="width: 80px; height: 80px;" crossorigin="anonymous">
            </div>
            <div style="font-size: 11px;">
              <strong>Invoice Number # ${invoiceNumber}</strong>
            </div>
          </div>
        </div>
        
        <!-- Order details and addresses -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 25px;">
          <div style="flex: 1; margin-right: 20px;">
            <div style="font-size: 11px; margin-bottom: 15px;">
              <strong>Order ID:</strong> OD${order.id}<br>
              <strong>Order Date:</strong> ${dateCreated}<br>
              <strong>Invoice Date:</strong> ${dateGenerated}<br>
              <strong>PAN:</strong> ABCDE1234F
            </div>
          </div>
          
          <div style="flex: 1; margin-right: 20px;">
            <div style="font-size: 11px;">
              <strong>Bill To</strong><br>
              ${customerName}<br>
              ${order.shippingAddress}<br>
              ${order.city || ""} ${order.state || ""} ${order.pincode || ""}<br>
              Phone: ${customerPhone}
            </div>
          </div>
          
          <div style="flex: 1;">
            <div style="font-size: 11px;">
              <strong>Ship To</strong><br>
              ${customerName}<br>
              ${order.shippingAddress}<br>
              ${order.city || ""} ${order.state || ""} ${order.pincode || ""}<br>
              Phone: ${customerPhone}<br><br>
              <em>*Keep this invoice and manufacturer box for warranty purposes.</em>
            </div>
          </div>
        </div>
        
        <!-- Items table -->
        <div style="margin-bottom: 20px;">
          <div style="font-size: 11px; margin-bottom: 10px;">
            <strong>Total items: ${order.items.length}</strong>
          </div>
          
          <!-- Invoice Table -->
          <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #000; padding: 8px; text-align: left; width: 15%;">Product</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: left; width: 25%;">Title</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: center; width: 6%;">Qty</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 9%;">Gross Amount ₹</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 9%;">Discounts /Coupons ₹</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 9%;">Taxable Value ₹</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 8%;">CGST ₹</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 8%;">SGST /UTGST ₹</th>
                <th style="border: 1px solid #000; padding: 8px; text-align: right; width: 11%;">Total ₹</th>
              </tr>
            </thead>
            <tbody>
    `;

    // Close the table header and add product information display
    invoiceHtml.innerHTML += `
            </tbody>
          </table>
          
          <!-- Product Information Section -->
    `;

    // Add order items in the format shown in reference image
    let subtotal = 0;
    let productInfoHTML = "";

    order.items.forEach((orderItem) => {
      try {
        const item = orderItem as any;

        const itemPrice =
          (typeof item.price === "number" ? item.price : 0) / 100;
        const itemQuantity =
          typeof item.quantity === "number" ? item.quantity : 1;
        const grossAmount = itemPrice * itemQuantity;
        const discount = 0;
        const taxableValue = grossAmount - discount;
        const cgst = taxableValue * 0.09;
        const sgst = taxableValue * 0.09;
        const itemTotal = taxableValue + cgst + sgst;
        subtotal += itemTotal;

        productInfoHTML += `
          <div style="margin-bottom: 20px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">${item.name || "Product"}</div>
            <div style="font-size: 10px; color: #666; margin-bottom: 3px;">FSN: BLINK${String(item.id).padStart(6, "0")}</div>
            <div style="font-size: 10px; color: #666; margin-bottom: 15px;">HSN/SAC: ${item.hsnCode || "85176290"}</div>
            
            <div style="margin-bottom: 8px;">
              <span style="font-weight: bold;">${item.name || "Product"}</span>
            </div>
            <div style="font-size: 10px; color: #666; margin-bottom: 10px;">
              ${item.selectedColor ? `Color: ${item.selectedColor}<br>` : ""}
              ${item.selectedSize ? `Size: ${item.selectedSize}<br>` : ""}
              Warranty: Standard manufacturer warranty<br>
              CGST: 9.0% | SGST: 9.0%
            </div>
            
            <div style="font-size: 12px; margin-bottom: 10px;">
              ${itemQuantity} ${grossAmount.toFixed(2)} ${discount.toFixed(2)} ${taxableValue.toFixed(2)} ${cgst.toFixed(2)} ${sgst.toFixed(2)} ${itemTotal.toFixed(2)}
            </div>
          </div>
        `;
      } catch (err) {
        console.error("Error processing item for invoice:", err);
      }
    });

    // Add the product information HTML
    invoiceHtml.innerHTML += productInfoHTML;

    // Add shipping charges section
    const shippingCharge = 45.0;
    const shippingDiscount = -40.0;
    const shippingTaxable = 4.24;
    const shippingCGST = 0.38;
    const shippingSGST = 0.38;
    const shippingTotal = 5.0;

    invoiceHtml.innerHTML += `
      <div style="margin-bottom: 20px;">
        <div style="font-weight: bold; font-size: 12px; margin-bottom: 10px;">Shipping And Handling Charges</div>
        <div style="font-size: 12px;">
          1 ${shippingCharge.toFixed(2)} ${shippingDiscount.toFixed(2)} ${shippingTaxable.toFixed(2)} ${shippingCGST.toFixed(2)} ${shippingSGST.toFixed(2)} ${shippingTotal.toFixed(2)}
        </div>
      </div>
    `;

    // Calculate totals
    let totalQuantity = 0;
    let totalGross = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let finalTotal = 0;

    // Sum up all items
    order.items.forEach((orderItem) => {
      const item = orderItem as any;
      const itemPrice = (typeof item.price === "number" ? item.price : 0) / 100;
      const itemQuantity =
        typeof item.quantity === "number" ? item.quantity : 1;
      const grossAmount = itemPrice * itemQuantity;
      const discount = 0;
      const taxableValue = grossAmount - discount;
      const cgst = taxableValue * 0.09;
      const sgst = taxableValue * 0.09;
      const itemTotal = taxableValue + cgst + sgst;

      totalQuantity += itemQuantity;
      totalGross += grossAmount;
      totalDiscount += discount;
      totalTaxable += taxableValue;
      totalCGST += cgst;
      totalSGST += sgst;
      finalTotal += itemTotal;
    });

    // Add shipping to totals
    totalQuantity += 1;
    totalGross += shippingCharge;
    totalDiscount += Math.abs(shippingDiscount);
    totalTaxable += shippingTaxable;
    totalCGST += shippingCGST;
    totalSGST += shippingSGST;
    finalTotal += shippingTotal;

    // Add totals row and footer
    invoiceHtml.innerHTML += `
            <tr style="background-color: #f0f0f0; font-weight: bold; border-top: 2px solid #000;">
              <td style="border: 1px solid #000; padding: 8px; font-size: 10px; font-weight: bold;" colspan="2">
                <strong>Total</strong>
              </td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 10px; font-weight: bold;">${totalQuantity}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; font-size: 10px; font-weight: bold;">${totalGross.toFixed(2)}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; font-size: 10px; font-weight: bold;">-${totalDiscount.toFixed(2)}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; font-size: 10px; font-weight: bold;">${totalTaxable.toFixed(2)}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; font-size: 10px; font-weight: bold;">${totalCGST.toFixed(2)}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; font-size: 10px; font-weight: bold;">${totalSGST.toFixed(2)}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; font-size: 10px; font-weight: bold;">${finalTotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
          </div>
        </div>
        
        <!-- Grand Total Section -->
        <div style="margin-top: 20px; text-align: right;">
          <div style="display: inline-block; padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9;">
            <div style="font-size: 14px; font-weight: bold;">
              Grand Total&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;₹ ${finalTotal.toFixed(2)}
            </div>
          </div>
        </div>
        
        <!-- Signature Section -->
        <div style="margin-top: 30px; text-align: right;">
          <div style="display: inline-block; text-align: center; font-size: 11px;">
            <div style="margin-bottom: 10px;">Blinkeach </div>
            <div style="margin-bottom: 10px; height: 50px; display: flex; align-items: center; justify-content: center;">
              <div style="font-style: italic; color: #666; font-size: 10px;">Digital Signature</div>
            </div>
            <div style="border-top: 1px solid #000; width: 150px; margin: 0 auto; padding-top: 5px;">
              Signature
            </div>
            <div style="margin-top: 5px;">
              Authorized Signatory
            </div>
          </div>
        </div>
        
        <!-- Returns Policy and Footer -->
        <div style="margin-top: 30px; font-size: 9px; line-height: 1.3;">
          <p style="margin: 10px 0;">
            <strong>Returns Policy:</strong> At Blinkeach we try to deliver perfectly each and every time. But in the off-chance that you need to return the item, please do so with the original Brand box/price tag, original packing and invoice without which it will be really difficult for us to act on your request. Please help us in helping you. Terms and conditions apply.
          </p>
          <p style="margin: 10px 0;">
            The goods sold as are intended for end user consumption and not for re-sale.
          </p>
          <p style="margin: 10px 0;">
            <strong>Regd. office:</strong> Blinkeach, Ground Floor House No GN0320781 KB Lane Near Yusuf Masjid, Panchaiti Akhara Gaya, Bihar - 823001
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px;">
            <div>
              <strong>Contact Blinkeach:</strong> 1800 123 4567 || www.blinkeach.com/support
            </div>
            <div style="text-align: right;">
              <strong>E. & O.E.</strong>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;page 1 of 1
            </div>
          </div>
        </div>
        
      </div>
    `;

    // Append to document
    document.body.appendChild(invoiceHtml);

    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(invoiceHtml, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Remove the temporary HTML element
      document.body.removeChild(invoiceHtml);

      // Create PDF from canvas
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio,
      );

      // Save the PDF
      pdf.save(`Blinkeach_Invoice_Order_${order.id}.pdf`);
      console.log("Invoice generated successfully for order:", order.id);
    } catch (error) {
      // If still in document, remove the temporary element
      if (document.body.contains(invoiceHtml)) {
        document.body.removeChild(invoiceHtml);
      }
      console.error("Error generating PDF:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error generating invoice:", error);
    throw error;
  }
};

// Helper function to get status background color for HTML
function getStatusBgColor(status: string): string {
  switch (status?.toLowerCase()) {
    case "pending":
      return "#ff9800";
    case "processing":
      return "#2196f3";
    case "shipped":
      return "#673ab7";
    case "delivered":
      return "#4caf50";
    case "cancelled":
      return "#f44336";
    default:
      return "#9e9e9e";
  }
}
