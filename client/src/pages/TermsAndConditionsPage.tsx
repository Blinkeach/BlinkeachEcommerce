import React from "react";
import { Helmet } from "react-helmet";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const TermsAndConditionsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Helmet>
        <title>{t("legal.terms_conditions.title")} - Blinkeach</title>
        <meta
          name="description"
          content={t("legal.terms_conditions.introduction")}
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
        {t("legal.terms_conditions.title")}
      </h1>

      <div className="prose max-w-none">
        <p>
          <strong>{t("legal.terms_conditions.last_updated")}</strong>
        </p>

        <p>{t("legal.terms_conditions.introduction")}</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using our website, creating an account, or making a
          purchase, you agree to be bound by these Terms. If you do not agree to
          these Terms, please do not use our services.
        </p>

        <h2>2. User Accounts</h2>
        <p>2.1. You must be live in India to create an account on Blinkeach.</p>
        <p>
          2.2. You are responsible for maintaining the confidentiality of your
          account credentials and for all activities that occur under your
          account.
        </p>
        <p>
          2.3. You agree to provide accurate, current, and complete information
          during the registration process and to update such information to keep
          it accurate, current, and complete.
        </p>

        <h2>3. Product Information</h2>
        <p>
          3.1. We strive to provide accurate descriptions, pricing, and
          availability information for all products listed on our platform.
        </p>
        <p>
          3.2. Colors of products displayed on the website may vary slightly
          from actual products due to digital display variations and individual
          screen settings.
        </p>
        <p>
          3.3. Blinkeach reserves the right to limit quantities, discontinue
          products, or modify product specifications without prior notice.
        </p>

        <h2>4. Pricing and Payment</h2>
        <p>
          4.1. All prices are in Indian Rupees (INR) and include applicable
          taxes unless stated otherwise.
        </p>
        <p>
          4.2. We accept various payment methods as displayed during checkout.
        </p>
        <p>
          4.3. Blinkeach reserves the right to change prices at any time without
          prior notice.
        </p>

        <h2>5. Order Confirmation and Delivery</h2>
        <p>
          5.1. An order is confirmed only after payment has been successfully
          processed and you have received an order confirmation email.
        </p>
        <p>
          5.2. Delivery times are estimates and may vary based on location,
          product availability, and other factors.
        </p>
        <p>
          5.3. Blinkeach is not responsible for delays in delivery due to
          circumstances beyond our control.
        </p>

        <h2>6. Cancellation and Returns</h2>
        <p>
          6.1. Cancellation policies and procedures are outlined in our
          Cancellation Policy.
        </p>
        <p>
          6.2. Return and refund procedures are outlined in our Return & Refund
          Policy.
        </p>

        <h2>7. User Conduct</h2>
        <p>
          Users must not engage in any of the following prohibited activities:
        </p>
        <ul>
          <li>
            Using the service for any illegal purpose or in violation of any
            laws
          </li>
          <li>
            Violating the intellectual property rights of Blinkeach or any third
            party
          </li>
          <li>Submitting false or misleading information</li>
          <li>
            Attempting to gain unauthorized access to other user accounts or
            Blinkeach systems
          </li>
          <li>
            Engaging in any activity that disrupts or interferes with the
            service
          </li>
        </ul>

        <h2>8. {t("legal.terms_conditions.intellectual_property")}</h2>
        <p>
          8.1. All content on the Blinkeach platform, including but not limited
          to text, graphics, logos, images, and software, is the property of
          Blinkeach or its content suppliers and is protected by copyright and
          other intellectual property laws.
        </p>
        <p>
          8.2. Users may not reproduce, distribute, modify, or create derivative
          works from any content without explicit permission from Blinkeach.
        </p>

        <h2>9. {t("legal.terms_conditions.limitation_liability")}</h2>
        <p>
          9.1. Blinkeach shall not be liable for any indirect, incidental,
          special, consequential, or punitive damages resulting from your use or
          inability to use the service.
        </p>
        <p>
          9.2. In no event shall Blinkeach's total liability exceed the amount
          paid by you for the product or service in question.
        </p>

        <h2>10. {t("legal.terms_conditions.indemnification")}</h2>
        <p>
          You agree to indemnify and hold harmless Blinkeach, its affiliates,
          officers, directors, employees, and agents from any claims,
          liabilities, damages, losses, costs, or expenses arising from your use
          of the service or violation of these Terms.
        </p>

        <h2>11. {t("legal.terms_conditions.governing_law")}</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the
          laws of India, without regard to its conflict of law principles.
        </p>

        <h2>12. {t("legal.terms_conditions.changes_to_terms")}</h2>
        <p>
          Blinkeach reserves the right to modify these Terms at any time. We
          will notify users of significant changes by posting a notice on our
          website. Your continued use of our services after such changes
          constitutes your acceptance of the new Terms.
        </p>

        <h2>13. {t("legal.terms_conditions.contact_us")}</h2>
        <p>
          If you have any questions about these Terms, please contact us at:
        </p>
        <p>
          Email: support@blinkeach.com
          <br />
          Address: Blinkeach Headquarters, WARD NO. 07, KB LANE, NEAR CHAURAHA
          MASJID, PANCHAYATI AKHARA Gaya BIHAR 823001., India
        </p>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;
