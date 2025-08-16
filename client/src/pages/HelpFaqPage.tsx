import React from "react";
import { Helmet } from "react-helmet";
import { ArrowLeft, Search, ChevronDown, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const HelpFaqPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Helmet>
        <title>Help & FAQ - Blinkeach</title>
        <meta
          name="description"
          content="Find answers to frequently asked questions about Blinkeach's services, policies, and features."
        />
      </Helmet>

      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-6">
        Help & Frequently Asked Questions
      </h1>

      <div className="relative mb-10">
        <Input placeholder="Search for answers..." className="pl-10" />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Orders & Shipping</CardTitle>
            <CardDescription>
              Track orders, returns, and shipping
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/track-order"
                  className="text-primary flex items-center gap-1 hover:underline"
                >
                  <ChevronRight className="h-4 w-4" />
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link
                  to="/return-refund-policy"
                  className="text-primary flex items-center gap-1 hover:underline"
                >
                  <ChevronRight className="h-4 w-4" />
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link
                  to="/shipping-policy"
                  className="text-primary flex items-center gap-1 hover:underline"
                >
                  <ChevronRight className="h-4 w-4" />
                  Shipping Policy
                </Link>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Account & Payment</CardTitle>
            <CardDescription>
              Login, account management, payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/login"
                  className="text-primary flex items-center gap-1 hover:underline"
                >
                  <ChevronRight className="h-4 w-4" />
                  Login Issues
                </Link>
              </li>
              <li>
                <Link
                  to="/profile"
                  className="text-primary flex items-center gap-1 hover:underline"
                >
                  <ChevronRight className="h-4 w-4" />
                  Manage Your Account
                </Link>
              </li>
              <li>
                <a
                  href="#payment-faqs"
                  className="text-primary flex items-center gap-1 hover:underline"
                >
                  <ChevronRight className="h-4 w-4" />
                  Payment FAQs
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Customer Support</CardTitle>
            <CardDescription>Get help with your issues</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/contact-us"
                  className="text-primary flex items-center gap-1 hover:underline"
                >
                  <ChevronRight className="h-4 w-4" />
                  Contact Us
                </Link>
              </li>
              <li>
                <a
                  href="tel:+918709144545"
                  className="text-primary flex items-center gap-1 hover:underline"
                >
                  <ChevronRight className="h-4 w-4" />
                  Call Us:+91 8709144545
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@blinkeach.com"
                  className="text-primary flex items-center gap-1 hover:underline"
                >
                  <ChevronRight className="h-4 w-4" />
                  Email: support@blinkeach.com
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general" className="mb-12">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full mb-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="payments" id="payment-faqs">
            Payments
          </TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="what-is-blinkeach">
              <AccordionTrigger>What is Blinkeach?</AccordionTrigger>
              <AccordionContent>
                Blinkeach is an Indian e-commerce platform that offers a wide
                range of products across multiple categories including
                electronics, fashion, home goods, and more. We provide a
                seamless shopping experience with secure payments, fast
                delivery, and excellent customer service.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="create-account">
              <AccordionTrigger>How do I create an account?</AccordionTrigger>
              <AccordionContent>
                To create an account, click on the "Sign Up" button in the
                top-right corner of the website. You can sign up using your
                email address, or through your Google or Facebook account.
                Follow the prompts to complete your registration by providing
                the required information.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="product-authenticity">
              <AccordionTrigger>
                Are all products on Blinkeach authentic?
              </AccordionTrigger>
              <AccordionContent>
                Yes, all products sold on Blinkeach are 100% authentic. We
                source our products directly from authorized distributors and
                manufacturers. We have a strict quality control process in place
                to ensure that only genuine products reach our customers.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="customer-support">
              <AccordionTrigger>
                How can I contact customer support?
              </AccordionTrigger>
              <AccordionContent>
                You can contact our customer support team through multiple
                channels:
                <ul className="list-disc pl-5 mt-2">
                  <li>Email: support@blinkeach.com</li>
                  <li>
                    Phone: +91 8709144545 (available Monday to Saturday, 9:00 AM
                    to 6:00 PM)
                  </li>
                  <li>
                    Live Chat: Available on our website during business hours
                  </li>
                  <li>
                    Contact Form: Visit our Contact Us page to submit a request
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="orders">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="check-order-status">
              <AccordionTrigger>
                How can I check my order status?
              </AccordionTrigger>
              <AccordionContent>
                You can check your order status by:
                <ul className="list-disc pl-5 mt-2">
                  <li>
                    Logging into your Blinkeach account and visiting the "My
                    Orders" section
                  </li>
                  <li>
                    Using the "Track Order" feature with your order ID and email
                  </li>
                  <li>Checking the order tracking link sent to your email</li>
                  <li>Contacting customer support with your order number</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cancel-order">
              <AccordionTrigger>Can I cancel my order?</AccordionTrigger>
              <AccordionContent>
                Yes, you can cancel your order as long as it hasn't been shipped
                yet. To cancel an order:
                <ol className="list-decimal pl-5 mt-2">
                  <li>Log in to your Blinkeach account</li>
                  <li>Go to "My Orders"</li>
                  <li>Find the order you want to cancel</li>
                  <li>Click on "Cancel Order"</li>
                  <li>Select a reason for cancellation</li>
                  <li>Confirm the cancellation</li>
                </ol>
                Once an order has been shipped, it cannot be cancelled, but you
                can refuse delivery or return it after receiving.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="modify-order">
              <AccordionTrigger>
                Can I modify my order after placing it?
              </AccordionTrigger>
              <AccordionContent>
                Unfortunately, we cannot modify an order once it has been
                placed. If you need to make changes, we recommend cancelling the
                current order (if it hasn't been shipped yet) and placing a new
                one with the correct details. If the order has already been
                shipped, you can return the item after delivery and place a new
                order.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="payments">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="payment-methods">
              <AccordionTrigger>
                What payment methods are accepted?
              </AccordionTrigger>
              <AccordionContent>
                We accept multiple payment methods including:
                <ul className="list-disc pl-5 mt-2">
                  <li>
                    Credit and Debit Cards (Visa, Mastercard, RuPay, American
                    Express)
                  </li>
                  <li>Net Banking</li>
                  <li>UPI (PhonePe, Google Pay, Paytm, etc.)</li>
                  <li>Wallets (Paytm, PhonePe, Amazon Pay, etc.)</li>
                  <li>EMI options from major banks</li>
                  <li>
                    Cash on Delivery (for eligible products and locations)
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="secure-payments">
              <AccordionTrigger>
                Are payments on Blinkeach secure?
              </AccordionTrigger>
              <AccordionContent>
                Yes, all payments on Blinkeach are secure. We use
                industry-standard encryption technologies and secure payment
                gateways to ensure that your payment information is protected.
                We do not store your credit card details on our servers.
                Additionally, we comply with PCI DSS (Payment Card Industry Data
                Security Standard) to ensure the security of your payment data.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="refund-timing">
              <AccordionTrigger>
                How long does it take to process refunds?
              </AccordionTrigger>
              <AccordionContent>
                Refund processing times vary depending on your payment method:
                <ul className="list-disc pl-5 mt-2">
                  <li>
                    Credit/Debit Cards: 5-7 business days after refund
                    initiation
                  </li>
                  <li>Net Banking: 3-5 business days</li>
                  <li>UPI: 1-3 business days</li>
                  <li>Wallets: 24-48 hours</li>
                  <li>
                    Cash on Delivery: 5-7 business days (refunded to your bank
                    account or as store credit)
                  </li>
                </ul>
                Please note that while we process refunds quickly, it may take
                additional time for the refunded amount to reflect in your
                account depending on your bank's policies.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="shipping">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="shipping-cost">
              <AccordionTrigger>How much does shipping cost?</AccordionTrigger>
              <AccordionContent>
                Our shipping structure is simple and transparent:
                <ul className="list-disc pl-5 mt-2">
                  <li>
                    Standard delivery charge: ₹40 applies to all orders across
                    India
                  </li>
                  <li>
                    Free delivery is automatically applied on orders above ₹499
                  </li>
                  <li>
                    All prices include 18% GST as per government regulations
                  </li>
                  <li>
                    Express delivery options may have additional charges based
                    on location
                  </li>
                  <li>
                    Special handling charges may apply for oversized or fragile
                    items
                  </li>
                </ul>
                The complete pricing breakdown including delivery charges,
                discounts, and GST will be displayed at checkout before payment.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="delivery-time">
              <AccordionTrigger>
                How long will it take to receive my order?
              </AccordionTrigger>
              <AccordionContent>
                Delivery times vary based on your location:
                <ul className="list-disc pl-5 mt-2">
                  <li>Metro Cities: 1-3 business days</li>
                  <li>Tier 1 Cities: 2-4 business days</li>
                  <li>Tier 2 Cities: 3-5 business days</li>
                  <li>Remote Areas: 5-7 business days</li>
                </ul>
                Express delivery options are available at checkout for faster
                delivery. Please note that these are estimated timeframes and
                actual delivery may be affected by factors such as product
                availability, payment verification, and local conditions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="international-shipping">
              <AccordionTrigger>Do you ship internationally?</AccordionTrigger>
              <AccordionContent>
                Currently, we only ship within India. We are working on
                expanding our services to international customers in the future.
                We'll announce when international shipping becomes available.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="returns">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="return-policy">
              <AccordionTrigger>What is your return policy?</AccordionTrigger>
              <AccordionContent>
                Our return policy allows you to return most items within 30 days
                of delivery. However, return eligibility and timeframes vary by
                product category:
                <ul className="list-disc pl-5 mt-2">
                  <li>Electronics: 7 days</li>
                  <li>Fashion & Apparel: 30 days</li>
                  <li>Home & Kitchen: 30 days</li>
                  <li>Books: 14 days</li>
                </ul>
                Returns are accepted only if the item is unused, in original
                packaging, and with all tags/accessories intact. Some items like
                personalized products, perishables, intimate wear, and opened
                software cannot be returned. For detailed information, please
                refer to our Return & Refund Policy.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="return-process">
              <AccordionTrigger>How do I return a product?</AccordionTrigger>
              <AccordionContent>
                To return a product:
                <ol className="list-decimal pl-5 mt-2">
                  <li>Log in to your Blinkeach account</li>
                  <li>Go to "My Orders"</li>
                  <li>Find the order containing the item you wish to return</li>
                  <li>Click on "Return" or "Exchange" next to the item</li>
                  <li>Select a reason for the return</li>
                  <li>Choose refund or exchange (if applicable)</li>
                  <li>Schedule a pickup or get drop-off instructions</li>
                  <li>Pack the item in its original packaging</li>
                  <li>Attach the return label (if provided)</li>
                  <li>
                    Hand over the package to the pickup person or drop it at the
                    designated location
                  </li>
                </ol>
                Once we receive and inspect the returned item, we'll process
                your refund or exchange.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="return-cost">
              <AccordionTrigger>Is there a fee for returns?</AccordionTrigger>
              <AccordionContent>
                Returns are free for:
                <ul className="list-disc pl-5 mt-2">
                  <li>Defective or damaged items</li>
                  <li>Incorrect items (if we sent you the wrong product)</li>
                  <li>Returns initiated within 7 days of delivery</li>
                </ul>
                For other returns, a shipping fee of ₹49-₹99 will be deducted
                from your refund amount, depending on the size and weight of the
                item. The exact return shipping fee will be shown during the
                return process.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>

      <div className="bg-muted p-6 rounded-lg text-center">
        <h2 className="text-xl font-semibold mb-3">Still have questions?</h2>
        <p className="mb-4 text-muted-foreground">
          Our customer support team is here to help you
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild>
            <Link to="/contact-us">Contact Us</Link>
          </Button>
          <Button variant="outline" asChild>
            <a href="tel:+918274019912">Call: +91 8274019912</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HelpFaqPage;
