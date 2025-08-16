import React from "react";
import { Helmet } from "react-helmet";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const ReturnRefundPolicyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Helmet>
        <title>{t("legal.return_refund.title")} - Blinkeach</title>
        <meta
          name="description"
          content={t("legal.return_refund.introduction")}
        />
      </Helmet>

      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            {t("legal.back_to_home")}
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-6">
        {t("legal.return_refund.title")}
      </h1>

      <div className="prose max-w-none">
        <p>
          <strong>{t("legal.return_refund.last_updated")}</strong>
        </p>

        <p>{t("legal.return_refund.introduction")}</p>

        <h2>1. {t("legal.return_refund.return_eligibility")}</h2>

        <h3>1.1 Standard Return Period</h3>
        <p>
          Most products can be returned within 7 days of delivery, provided they
          meet the following conditions:
        </p>
        <ul>
          <li>
            The product is unused, unworn, unwashed, and in its original
            condition
          </li>
          <li>The product includes all original tags, labels, and packaging</li>
          <li>You have proof of purchase (order confirmation or invoice)</li>
        </ul>

        <h3>1.2 Category-Specific Return Periods</h3>
        <table className="w-full border-collapse border border-gray-300 my-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">
                Product Category
              </th>
              <th className="border border-gray-300 p-2 text-left">
                Return Period
              </th>
              <th className="border border-gray-300 p-2 text-left">
                Special Conditions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2">Electronics</td>
              <td className="border border-gray-300 p-2">7 days</td>
              <td className="border border-gray-300 p-2">
                Must be in original packaging with all accessories
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2">Fashion & Apparel</td>
              <td className="border border-gray-300 p-2">7 days</td>
              <td className="border border-gray-300 p-2">
                Items must have tags attached and be unworn
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2">Home & Kitchen</td>
              <td className="border border-gray-300 p-2">7 days</td>
              <td className="border border-gray-300 p-2">
                Must be unused with original packaging
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2">Books</td>
              <td className="border border-gray-300 p-2">7 days</td>
              <td className="border border-gray-300 p-2">
                Must be in new condition without damage or markings
              </td>
            </tr>
          </tbody>
        </table>

        <h3>1.3 Non-Returnable Items</h3>
        <p>The following items cannot be returned:</p>
        <ul>
          <li>Personalized or custom-made products</li>
          <li>Perishable goods (food, flowers, etc.)</li>
          <li>Intimate apparel and swimwear for hygiene reasons</li>
          <li>
            Digital content or software that has been accessed or downloaded
          </li>
          <li>Gift cards</li>
          <li>
            Products explicitly marked as "non-returnable" on the product page
          </li>
        </ul>

        <h2>2. {t("legal.return_refund.return_process")}</h2>

        <h3>2.1 Initiating a Return</h3>
        <p>To initiate a return:</p>
        <ol>
          <li>Log in to your Blinkeach account</li>
          <li>
            Navigate to "My Orders" and select the order containing the item you
            wish to return
          </li>
          <li>Click on "Return or Exchange" next to the eligible item</li>
          <li>
            Select the reason for return and whether you prefer a refund or
            exchange
          </li>
          <li>Follow the instructions to complete the return request</li>
        </ol>
        <p>
          Alternatively, you can contact our customer support team for
          assistance.
        </p>

        <h3>2.2 Return Shipping</h3>
        <p>
          Once your return request is approved, you will receive instructions
          for returning the item, including:
        </p>
        <ul>
          <li>
            A return shipping label (if eligible for free return shipping)
          </li>
          <li>Instructions for packaging the item</li>
          <li>Information about drop-off points or pickup scheduling</li>
        </ul>

        <h3>2.3 Return Shipping Costs</h3>
        <p>Return shipping is free for:</p>
        <ul>
          <li>Defective or damaged items</li>
          <li>Incorrect items (if we sent you the wrong product)</li>
          <li>Returns within 7 days of delivery</li>
        </ul>
        <p>
          For all other returns, a shipping fee of ₹49-₹99 will be deducted from
          your refund amount, depending on the size and weight of the item.
        </p>

        <h2>3. {t("legal.return_refund.refund_process")}</h2>

        <h3>3.1 Refund Timeline</h3>
        <p>
          Once we receive and inspect your return, we'll process your refund
          according to this timeline:
        </p>
        <ul>
          <li>
            <strong>Refund Initiation:</strong> 1-2 business days after
            receiving and inspecting the returned item
          </li>
          <li>
            <strong>Credit/Debit Card Refunds:</strong> 5-7 business days for
            the amount to reflect in your account
          </li>
          <li>
            <strong>UPI/Net Banking Refunds:</strong> 3-5 business days
          </li>
          <li>
            <strong>Wallet Refunds:</strong> 24-48 hours
          </li>
        </ul>

        <h3>3.2 Refund Methods</h3>
        <p>
          Refunds will be issued to the original payment method used for the
          purchase. If that's not possible:
        </p>
        <ul>
          <li>
            You can opt for a Blinkeach Wallet credit (which will be issued
            instantly)
          </li>
          <li>You can request a bank transfer to your specified account</li>
        </ul>

        <h3>3.3 Partial Refunds</h3>
        <p>In some cases, we may issue partial refunds:</p>
        <ul>
          <li>
            When an item is returned without original packaging or accessories
          </li>
          <li>When an item shows signs of use or wear</li>
          <li>When only part of an order is returned</li>
        </ul>

        <h2>4. {t("legal.return_refund.exchanges")}</h2>

        <p>
          If you wish to exchange an item for a different size, color, or
          variant:
        </p>
        <ol>
          <li>
            Follow the same process as for returns, selecting "Exchange" instead
            of "Refund"
          </li>
          <li>Select the replacement item you want</li>
          <li>
            If the replacement item is priced higher, you'll need to pay the
            difference
          </li>
          <li>
            If the replacement item is priced lower, we'll refund the difference
          </li>
        </ol>
        <p>Exchanges are subject to product availability.</p>

        <h2>5. Warranty Claims</h2>

        <p>
          Many products sold on Blinkeach come with a manufacturer's warranty.
          For warranty claims:
        </p>
        <ul>
          <li>
            Contact our customer support with details of the issue within the
            warranty period
          </li>
          <li>
            We'll guide you through the process of claiming warranty service
          </li>
          <li>
            In some cases, you may need to contact the manufacturer directly
          </li>
        </ul>

        <h2>6. {t("legal.return_refund.damaged_items")}</h2>

        <p>If you receive a damaged or defective item:</p>
        <ul>
          <li>Report the issue within 48 hours of delivery</li>
          <li>Provide photos of the damaged/defective product and packaging</li>
          <li>
            We'll arrange for a replacement or full refund including shipping
            costs
          </li>
        </ul>

        <h2>7. {t("legal.return_refund.contact_us")}</h2>

        <p>
          If you have any questions about our return and refund policy, please
          contact us at:
        </p>
        <p>
          If you have any questions about our return and refund policy, please
          contact us at:
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

export default ReturnRefundPolicyPage;
