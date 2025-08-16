import React from "react";
import { Helmet } from "react-helmet";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const ShippingPolicyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Helmet>
        <title>{t("legal.shipping.title")} - Blinkeach</title>
        <meta name="description" content={t("legal.shipping.introduction")} />
      </Helmet>

      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            {t("legal.back_to_home")}
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-6">{t("legal.shipping.title")}</h1>

      <div className="prose max-w-none">
        <p>
          <strong>{t("legal.shipping.last_updated")}</strong>
        </p>

        <p>{t("legal.shipping.introduction")}</p>

        <h2>1. {t("legal.shipping.coverage")}</h2>

        <p>
          Blinkeach delivers products across all major cities and most areas
          within India. We partner with reputable logistics companies including
          Delhivery, EKart, BlueDart, and Express Delivery to ensure reliable
          and efficient shipping services.
        </p>

        <h2>2. {t("legal.shipping.processing")}</h2>

        <ul>
          <li>
            Most orders are processed within 24 hours of payment confirmation.
          </li>
          <li>
            Orders placed after 2:00 PM IST may be processed the following
            business day.
          </li>
          <li>
            Orders placed on weekends or public holidays will be processed on
            the next business day.
          </li>
          <li>
            During sale periods or promotional events, processing times may be
            slightly longer.
          </li>
        </ul>

        <h2>3. {t("legal.shipping.delivery_time")}</h2>

        <table className="w-full border-collapse border border-gray-300 my-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">
                Location Type
              </th>
              <th className="border border-gray-300 p-2 text-left">
                Standard Delivery
              </th>
              <th className="border border-gray-300 p-2 text-left">
                Express Delivery
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2">
                Metro Cities (Delhi NCR, Mumbai, Bangalore, Chennai, Kolkata,
                Hyderabad)
              </td>
              <td className="border border-gray-300 p-2">1-3 business days</td>
              <td className="border border-gray-300 p-2">Next-day delivery*</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2">Tier 1 Cities</td>
              <td className="border border-gray-300 p-2">2-4 business days</td>
              <td className="border border-gray-300 p-2">1-2 business days</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2">Tier 2 Cities</td>
              <td className="border border-gray-300 p-2">3-5 business days</td>
              <td className="border border-gray-300 p-2">2-3 business days</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2">Remote Areas</td>
              <td className="border border-gray-300 p-2">5-7 business days</td>
              <td className="border border-gray-300 p-2">3-5 business days</td>
            </tr>
          </tbody>
        </table>

        <p className="text-sm">
          * Next-day delivery is available for orders placed before 2:00 PM IST,
          subject to product availability and address verification.
        </p>

        <p>
          Please note that the above timeframes are estimates and may vary due
          to factors such as weather conditions, natural disasters, political
          events, or other circumstances beyond our control.
        </p>

        <h2>4. {t("legal.shipping.shipping_costs")}</h2>

        <ul>
          <li>
            <strong>Standard Delivery Charge:</strong> ₹40 applies to all orders
            across India.
          </li>
          <li>
            <strong>Free Delivery:</strong> Available on orders above ₹499 -
            delivery charge waived automatically.
          </li>
          <li>
            <strong>GST Inclusive:</strong> All prices include 18% GST as per
            government regulations.
          </li>
          <li>
            <strong>Express Shipping:</strong> Additional charges may apply for
            same-day or next-day delivery based on location.
          </li>
          <li>
            <strong>Special Products:</strong> Oversized, heavy, or fragile
            items may incur additional handling charges.
          </li>
        </ul>

        <p>
          The exact shipping fee will be displayed at checkout before payment
          confirmation.
        </p>

        <h2>5. {t("legal.shipping.tracking")}</h2>

        <p>
          Once your order is shipped, you will receive a confirmation email with
          a tracking number and a link to track your order. You can also track
          your order by:
        </p>

        <ul>
          <li>
            Logging into your Blinkeach account and navigating to "My Orders"
          </li>
          <li>Using the "Track Order" link in the website footer</li>
          <li>Contacting our customer support with your order number</li>
        </ul>

        <h2>6. Shipping Restrictions</h2>

        <p>
          Some products may not be available for delivery to certain areas due
          to local regulations, transportation limitations, or product-specific
          constraints. You will be notified if any item in your cart cannot be
          shipped to your address before completing your purchase.
        </p>

        <h2>7. {t("legal.shipping.international")}</h2>

        <p>
          Currently, Blinkeach only ships within India. We hope to expand our
          services to international customers in the future.
        </p>

        <h2>8. Delivery Verification</h2>

        <p>
          For security purposes, the recipient may be required to present a
          valid photo ID at the time of delivery. For high-value items, an OTP
          verification might be required to confirm delivery.
        </p>

        <h2>9. {t("legal.shipping.shipping_issues")}</h2>

        <p>
          If you haven't received your order within the estimated delivery
          timeframe, please contact our customer support. We will investigate
          the status of your order with our shipping partners and provide
          appropriate resolution.
        </p>

        <h2>10. Undeliverable Packages</h2>

        <p>
          If a package is returned to us because it was undeliverable (incorrect
          address, recipient unavailable, etc.), we will contact you to arrange
          redelivery or provide a refund after deducting shipping charges.
        </p>

        <h2>11. {t("legal.shipping.contact_us")}</h2>

        <p>
          If you have any questions about our shipping policy, please contact us
          at:
        </p>
        <p>
          Email: support@blinkeach.com
          <br />
          Phone: +91 8274019912
          <br />
          Customer Support Hours: Monday to Saturday, 9:00 AM to 6:00 PM IST
        </p>
      </div>
    </div>
  );
};

export default ShippingPolicyPage;
