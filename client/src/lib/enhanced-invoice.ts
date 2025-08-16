import { format } from "date-fns";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import QRCode from "qrcode";

// Function to convert number to words
function convertToWords(num: number): string {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const thousands = ['', 'thousand', 'lakh', 'crore'];

  if (num === 0) return 'zero';

  function convertHundreds(n: number): string {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + ' ';
      return result;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result;
  }

  let result = '';
  let placeValue = 0;

  while (num > 0) {
    let chunk;
    if (placeValue === 0) {
      chunk = num % 1000;
      num = Math.floor(num / 1000);
    } else if (placeValue === 1) {
      chunk = num % 100;
      num = Math.floor(num / 100);
    } else {
      chunk = num % 100;
      num = Math.floor(num / 100);
    }

    if (chunk !== 0) {
      result = convertHundreds(chunk) + thousands[placeValue] + ' ' + result;
    }
    placeValue++;
  }

  return result.trim();
}

// Generate QR code as data URL
async function generateQRCode(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      width: 100,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('QR code generation failed:', error);
    return '';
  }
}

// Enhanced invoice generator with professional PDF-style layout
export const generateEnhancedInvoice = async (order: any): Promise<void> => {
  try {
    console.log("Generating enhanced invoice for order:", order.id);

    // Generate QR code for orders page
    const qrCodeDataUrl = await generateQRCode('https://blinkeach.com/orders');

    // Create invoice container
    const invoiceContainer = document.createElement('div');
    invoiceContainer.style.position = 'fixed';
    invoiceContainer.style.top = '-9999px';
    invoiceContainer.style.left = '-9999px';
    invoiceContainer.style.width = '800px';
    invoiceContainer.style.zIndex = '-1';
    document.body.appendChild(invoiceContainer);

    // Calculate pricing from actual order data
    let subtotal = 0;
    let totalQuantity = 0;
    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any) => {
        subtotal += (item.price * item.quantity) / 100;
        totalQuantity += item.quantity;
      });
    }

    // Calculate taxes based on product-specific GST rates from database
    let totalIgst = 0;
    let totalCgst = 0; 
    let totalSgst = 0;
    let totalItemDiscount = 0;
    
    // Fetch product GST rates from database for each item
    const itemsWithGst = await Promise.all(
      order.items.map(async (item: any) => {
        try {
          const response = await fetch(`/api/products/${item.productId}`);
          const product = await response.json();
          return {
            ...item,
            igst: product.igst || 0,
            cgst: product.cgst || 0,
            sgst: product.sgst || 0
          };
        } catch (error) {
          console.error('Error fetching product GST:', error);
          return {
            ...item,
            igst: 0,
            cgst: 0,
            sgst: 0
          };
        }
      })
    );
    
    // Calculate taxes with fetched GST rates
    itemsWithGst.forEach((item: any) => {
      const itemSubtotal = (item.price * item.quantity) / 100;
      const itemDiscount = 0; // No individual item discount in universal system
      const itemTaxableValue = itemSubtotal - itemDiscount;
      
      // Use actual GST rates from database
      const igstRate = (item.igst || 0) / 100;
      const cgstRate = (item.cgst || 0) / 100;
      const sgstRate = (item.sgst || 0) / 100;
      
      totalIgst += itemTaxableValue * igstRate;
      totalCgst += itemTaxableValue * cgstRate;
      totalSgst += itemTaxableValue * sgstRate;
      totalItemDiscount += itemDiscount;
    });
    
    const gstAmount = totalIgst + totalCgst + totalSgst;
    const cgstAmount = totalCgst;
    const sgstAmount = totalSgst;
    
    // Universal discount system
    const deliveryCharge = 40; // Standard delivery charge
    const universalDiscount = 40; // Universal discount for all users
    const finalDeliveryCharge = 0; // Free delivery due to universal discount
    
    // Add COD charges if payment method is COD
    const codCharge = order.paymentMethod === 'cod' ? 10 : 0; // ₹10 COD charge
    
    // Calculate online payment discount (1% for <₹1000, 5% for ≥₹1000)
    const onlinePaymentDiscount = order.paymentMethod === 'razorpay' 
      ? (order.totalAmount >= 100000 ? 50 : (order.totalAmount * 0.01)) // 5% or 1% discount
      : 0;
    
    // Calculate final totals
    const totalBeforeDiscount = subtotal + deliveryCharge + gstAmount + codCharge;
    const grandTotal = totalBeforeDiscount - universalDiscount - onlinePaymentDiscount;

    // Professional PDF-style invoice HTML matching the reference image exactly
    invoiceContainer.innerHTML = `
      <div class="enhanced-invoice" style="
        font-family: Arial, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        background: white;
        padding: 15px;
        border: 2px solid #000;
        line-height: 1.2;
        font-size: 11px;
      ">
        <!-- Header Section -->
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
          border-bottom: 1px solid #000;
          padding-bottom: 10px;
        ">
          <div style="display: flex; align-items: center;">
            <div style="
              width: 35px;
              height: 35px;
              background: #ff6b35;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 10px;
            ">
              <span style="color: white; font-weight: bold; font-size: 8px;">BLINK<br>EACH</span>
            </div>
          </div>
          <div style="text-align: center;">
            <h1 style="margin: 0; font-size: 16px; font-weight: bold;">Tax Invoice</h1>
          </div>
          <div style="text-align: right;">
            <div style="
              width: 60px;
              height: 60px;
              border: 1px solid #000;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 5px;
              background: white;
              padding: 2px;
            ">
              ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" style="width: 56px; height: 56px; object-fit: contain;" alt="QR Code">` : '<div style="font-size: 6px; text-align: center; line-height: 1.1;">QR Code<br>Scanner<br>Here</div>'}
            </div>
          </div>
        </div>

        <!-- Company Info -->
        <div style="font-size: 10px; margin-bottom: 15px; line-height: 1.3;">
          <div><strong>Sold By:</strong> Blinkeach India Private Limited</div>
          <div><strong>Address:</strong> Blinkeach India Private Limited, House No QN3320751 KB Lane Near Yusuf Masjid</div>
          <div>Panchela Afraan Gaya, Bihar, India - 823001, IN-BR</div>
          <div><strong>GSTIN:</strong> 10ESPAG3624N1ZQ</div>
        </div>

        <!-- Order Details and Invoice Number -->
        <div style="
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          font-size: 10px;
        ">
          <div style="width: 33%;">
            <div><strong>Order ID:</strong> OD${order.id}</div>
            <div><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-GB')}</div>
            <div><strong>Invoice Date:</strong> ${new Date().toLocaleDateString('en-GB')}</div>
            <div><strong>PAN:</strong> ABCDE1234F</div>
          </div>
          
          <div style="width: 33%; text-align: center;">
            <div style="font-weight: bold; margin-bottom: 5px;">Bill To</div>
            <div style="font-weight: bold;">${order.userName}</div>
            <div>${order.userName}, ${order.shippingAddress.split(',').slice(-1)[0] || '823001'}</div>
            <div>${order.shippingAddress.split(',').slice(0, -1).join(',').substring(0, 40) || 'Hyderabad, Telangana, Hyderabad, Telangana'}</div>
            <div>- ${order.shippingAddress.split(',').slice(-1)[0] || '500027'}</div>
            <div>Phone: ${order.userPhone || '9270915055'}</div>
          </div>
          
          <div style="width: 33%; text-align: right;">
            <div style="font-weight: bold; margin-bottom: 5px;">Ship To</div>
            <div style="font-weight: bold;">${order.userName}</div>
            <div>${order.userName}, ${order.shippingAddress.split(',').slice(-1)[0] || '823001'}</div>
            <div>${order.shippingAddress.split(',').slice(0, -1).join(',').substring(0, 40) || 'Hyderabad, Telangana, Hyderabad, Telangana'}</div>
            <div>- ${order.shippingAddress.split(',').slice(-1)[0] || '500027'}</div>
            <div>Phone: ${order.userPhone || '9270915055'}</div>
          </div>
        </div>

        <!-- Invoice Number -->
        <div style="text-align: right; font-size: 10px; margin-bottom: 15px;">
          <div><strong>Invoice Number # BLK${order.id}250413</strong></div>
        </div>

        <!-- Items Table -->
        <table style="
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 10px;
        ">
          <thead>
            <tr>
              <th style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold; font-size: 9px; width: 5%;">S. N.</th>
              <th style="border: 1px solid #000; padding: 4px; text-align: left; font-weight: bold; font-size: 9px; width: 25%;">Product Name</th>
              <th style="border: 1px solid #000; padding: 4px; text-align: left; font-weight: bold; font-size: 9px; width: 30%;">Title\\Description</th>
              <th style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold; font-size: 9px; width: 8%;">Price</th>
              <th style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold; font-size: 9px; width: 8%;">Discount\\<br>Coupons</th>
              <th style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold; font-size: 9px; width: 6%;">QTY<br>(Unit)</th>
              <th style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold; font-size: 9px; width: 8%;">Taxable<br>Value</th>
              <th style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold; font-size: 9px; width: 10%;">IGST or CGST<br>SGST/UTGST</th>
              <th style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold; font-size: 9px; width: 10%;">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsWithGst && itemsWithGst.length > 0 ? itemsWithGst.map((item: any, index: number) => {
              const itemPrice = (item.price / 100);
              const itemSubtotal = itemPrice * item.quantity;
              const itemDiscount = 0; // No individual item discount in universal system
              const itemTaxableValue = itemSubtotal - itemDiscount;
              const itemIgst = itemTaxableValue * ((item.igst || 0) / 100);
              const itemCgst = itemTaxableValue * ((item.cgst || 0) / 100);
              const itemSgst = itemTaxableValue * ((item.sgst || 0) / 100);
              const itemTotal = itemTaxableValue + itemIgst + itemCgst + itemSgst;
              
              return `
                <tr style="font-size: 9px;">
                  <td style="border: 1px solid #000; padding: 3px; text-align: center; vertical-align: top;">${index + 1}</td>
                  <td style="border: 1px solid #000; padding: 3px; vertical-align: top;">
                    <div style="font-weight: bold; font-size: 9px;">${item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name}</div>
                    <div style="font-size: 8px; color: #666;">HSN/SAC:${item.hsnCode || '88374940'}</div>
                  </td>
                  <td style="border: 1px solid #000; padding: 3px; vertical-align: top; font-size: 9px;">
                    <div>${item.name.length > 35 ? item.name.substring(0, 35) + '...' : item.name}</div>
                    ${item.selectedColor ? `<div style="font-size: 8px;">(${item.selectedColor} Colour,</div>` : ''}
                    ${item.selectedSize ? `<div style="font-size: 8px;">Size: ${item.selectedSize},</div>` : ''}
                    <div style="font-size: 8px;">Pack of ${item.quantity}/Pcs)</div>
                  </td>
                  <td style="border: 1px solid #000; padding: 3px; text-align: center; vertical-align: top; font-size: 9px;">${itemPrice.toFixed(2)}</td>
                  <td style="border: 1px solid #000; padding: 3px; text-align: center; vertical-align: top; font-size: 9px;">-${itemDiscount.toFixed(2)}</td>
                  <td style="border: 1px solid #000; padding: 3px; text-align: center; vertical-align: top; font-size: 9px;">${item.quantity.toString().padStart(2, '0')} PCS</td>
                  <td style="border: 1px solid #000; padding: 3px; text-align: center; vertical-align: top; font-size: 9px;">${itemTaxableValue.toFixed(2)}</td>
                  <td style="border: 1px solid #000; padding: 3px; text-align: center; vertical-align: top; font-size: 8px;">
                    ${itemIgst > 0 ? `<div>${itemIgst.toFixed(2)} (${(item.igst || 0).toFixed(1)}%)</div>` : ''}
                    ${itemCgst > 0 ? `<div>${itemCgst.toFixed(2)} (${(item.cgst || 0).toFixed(1)}%)</div>` : ''}
                    ${itemSgst > 0 ? `<div>${itemSgst.toFixed(2)} (${(item.sgst || 0).toFixed(1)}%)</div>` : ''}
                    ${itemIgst === 0 && itemCgst === 0 && itemSgst === 0 ? '<div>0.00 (0%)</div>' : ''}
                  </td>
                  <td style="border: 1px solid #000; padding: 3px; text-align: center; vertical-align: top; font-weight: bold; font-size: 9px;">${itemTotal.toFixed(2)}</td>
                </tr>
              `;
            }).join('') : ''}
            
            <!-- Totals Row -->
            <tr style="font-weight: bold; font-size: 10px;">
              <td colspan="4" style="border: 1px solid #000; padding: 4px; text-align: center;">Total</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">-${totalItemDiscount.toFixed(2)}</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">${totalQuantity.toString().padStart(2, '0')}</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">${(subtotal - totalItemDiscount).toFixed(2)}</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center;">${gstAmount.toFixed(2)}</td>
              <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">${(subtotal - totalItemDiscount + gstAmount).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Tax Summary Section -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
          <div style="width: 30%;">
            <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
              <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #000; padding: 4px; text-align: left; font-weight: bold;">GST</th>
                <th style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">Amount</th>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 4px;">IGST</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${totalIgst.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 4px;">CGST</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${cgstAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 4px;">SGST/UTGST</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${sgstAmount.toFixed(2)}</td>
              </tr>
              <tr style="font-weight: bold;">
                <td style="border: 1px solid #000; padding: 4px;">Total Tax Amount</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${gstAmount.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <div style="width: 35%;">
            <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
              <tr>
                <th style="border: 1px solid #000; padding: 4px; text-align: left; font-weight: bold;">EXTRA Discount</th>
                <th style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">Total Discount Amount</th>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 4px;">Shipping & Handling Charges</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${deliveryCharge.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 4px;">Universal Discount for All Users</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">-${universalDiscount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 4px;">${order.paymentMethod === 'cod' ? 'COD Charges' : 'Online Payment Discount'}</td>
                <td style="border: 1px solid #000; padding: 4px; text-align: center;">${order.paymentMethod === 'cod' ? codCharge.toFixed(2) : `-${onlinePaymentDiscount.toFixed(2)}`}</td>
              </tr>
            </table>
          </div>
          
          <div style="width: 30%; text-align: right; font-size: 12px; font-weight: bold;">
            <div style="border: 1px solid #000; padding: 8px; background-color: #f9f9f9; margin-bottom: 10px;">
              Grand Total<br>
              <span style="font-size: 16px;">₹ ${grandTotal.toFixed(0)}</span>
            </div>
          </div>
        </div>

        <!-- Amount in Words -->
        <div style="margin-bottom: 15px; font-size: 10px;">
          <div style="font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px;">
            AMOUNT IN WORD:
          </div>
          <div style="padding-top: 5px; text-transform: uppercase;">
            ${convertToWords(Math.round(grandTotal))} RUPEES ONLY.
          </div>
        </div>

        <!-- Terms and Signature -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 15px;">
          <div style="width: 60%; font-size: 9px;">
            <div style="font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 3px;">
              Terms & Conditions:
            </div>
            <div style="line-height: 1.3;">
              • Keep this Invoice and manufacturer box for warranty purposes. (If warranty is applicable)<br>
              • Goods once sold will not be taken back or exchanged except under our return policy<br>
              • All disputes are subject to jurisdiction of courts in our city only
            </div>
          </div>
          
          <div style="width: 35%; text-align: right; font-size: 10px;">
            <div style="margin-bottom: 30px;">
              <div style="font-weight: bold; margin-bottom: 5px;">for BLINK EACH</div>
              <div style="
                width: 100px;
                height: 50px;
                border: 1px solid #ddd;
                margin: 10px 0 10px auto;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 8px;
                color: #999;
              ">Proprietor</div>
            </div>
            <div style="border-top: 1px solid #000; padding-top: 5px; font-size: 9px;">
              Authorised Signatory
            </div>
          </div>
        </div>
      </div>
    `;

    // Generate PDF using html2canvas and jsPDF
    const canvas = await html2canvas(invoiceContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    // Download the PDF
    const fileName = `Invoice_${order.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    // Clean up
    document.body.removeChild(invoiceContainer);
    
    console.log("Enhanced invoice generated successfully");
  } catch (error) {
    console.error('Error generating enhanced invoice:', error);
    throw error;
  }
};