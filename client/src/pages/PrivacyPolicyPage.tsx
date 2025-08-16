import React from "react";
import { Helmet } from "react-helmet";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const PrivacyPolicyPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Helmet>
        <title>{t("legal.privacy_policy.title")} - Blinkeach</title>
        <meta
          name="description"
          content={t("legal.privacy_policy.introduction")}
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
        {t("legal.privacy_policy.title")}
      </h1>

      <div className="prose max-w-none">
        <p>
          <strong>{t("legal.privacy_policy.last_updated")}</strong>
        </p>

        <p>{t("legal.privacy_policy.introduction")}</p>

        <h2>1. {t("legal.privacy_policy.information_collected")}</h2>

        <h3>1.1 Personal Information</h3>
        <p>We may collect the following personal information:</p>
        <ul>
          <li>
            <strong>Contact Information:</strong> Name, email address, phone
            number, and delivery address.
          </li>
          <li>
            <strong>Account Information:</strong> Username, password (stored in
            encrypted form), and profile details.
          </li>
          <li>
            <strong>Payment Information:</strong> Credit/debit card details, UPI
            IDs, or other payment method information (note that payment card
            details are processed securely by our payment processors and are not
            stored on our servers).
          </li>
          <li>
            <strong>Transaction Information:</strong> Order history, purchase
            details, and delivery information.
          </li>
        </ul>

        <h3>1.2 Usage Information</h3>
        <p>
          We automatically collect certain information about your device and how
          you interact with our platform:
        </p>
        <ul>
          <li>
            <strong>Device Information:</strong> IP address, browser type,
            operating system, device type, and unique device identifiers.
          </li>
          <li>
            <strong>Usage Data:</strong> Pages visited, products viewed, time
            spent on site, click patterns, and referral sources.
          </li>
          <li>
            <strong>Location Information:</strong> General location based on IP
            address or more precise location if you provide permission.
          </li>
        </ul>

        <h2>2. {t("legal.privacy_policy.information_use")}</h2>
        <p>We use your information for the following purposes:</p>
        <ul>
          <li>To provide, maintain, and improve our services</li>
          <li>To process and fulfill your orders</li>
          <li>
            To communicate with you about orders, products, services, and
            promotional offers
          </li>
          <li>To personalize your shopping experience</li>
          <li>
            To detect, prevent, and address technical issues or fraudulent
            activities
          </li>
          <li>To comply with legal obligations</li>
        </ul>

        <h2>3. {t("legal.privacy_policy.information_sharing")}</h2>
        <p>We may share your information with:</p>
        <ul>
          <li>
            <strong>Service Providers:</strong> Third-party companies that
            provide services on our behalf, such as payment processing,
            delivery, customer support, and marketing assistance.
          </li>
          <li>
            <strong>Business Partners:</strong> Trusted sellers, manufacturers,
            and partners to fulfill your orders or provide promotions.
          </li>
          <li>
            <strong>Legal Authorities:</strong> When required by law, legal
            process, or to protect our rights and those of others.
          </li>
        </ul>
        <p>
          We do not sell your personal information to third parties for their
          marketing purposes without your explicit consent.
        </p>

        <h2>4. {t("legal.privacy_policy.data_security")}</h2>
        <p>
          We implement appropriate technical and organizational measures to
          protect your personal information against unauthorized access,
          alteration, disclosure, or destruction. However, no method of
          transmission over the Internet or electronic storage is 100% secure,
          and we cannot guarantee absolute security.
        </p>

        <h2>5. {t("legal.privacy_policy.your_rights")}</h2>
        <p>
          Depending on your location, you may have certain rights regarding your
          personal information, including:
        </p>
        <ul>
          <li>
            The right to access and receive a copy of your personal information
          </li>
          <li>The right to correct or update your personal information</li>
          <li>The right to request deletion of your personal information</li>
          <li>
            The right to restrict or object to our processing of your personal
            information
          </li>
          <li>The right to data portability</li>
        </ul>
        <p>
          To exercise these rights, please contact us using the information
          provided at the end of this policy.
        </p>

        <h2>6. {t("legal.privacy_policy.cookies")}</h2>
        <p>
          We use cookies and similar tracking technologies to collect and track
          information about your browsing behavior. You can control cookies
          through your browser settings, but disabling cookies may limit your
          use of certain features.
        </p>

        <h2>7. {t("legal.privacy_policy.childrens_privacy")}</h2>
        <p>
          Our services are not directed to individuals under the age of 18. We
          do not knowingly collect personal information from children. If you
          are a parent or guardian and believe your child has provided us with
          personal information, please contact us.
        </p>

        <h2>8. {t("legal.privacy_policy.international_transfers")}</h2>
        <p>
          Your information may be transferred to and processed in countries
          other than the one in which you reside. These countries may have
          different data protection laws. We will take appropriate measures to
          ensure that your personal information receives an adequate level of
          protection in the countries where we process it.
        </p>

        <h2>9. {t("legal.privacy_policy.policy_changes")}</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify
          you of any changes by posting the new Privacy Policy on this page and
          updating the "Last Updated" date. You are advised to review this
          Privacy Policy periodically for any changes.
        </p>

        <h2>10. {t("legal.privacy_policy.contact_us")}</h2>
        <p>
          If you have any questions about this Privacy Policy or our data
          practices, please contact us at:
        </p>
        <p>
          If you have any questions about this Privacy Policy or our data
          practices, please contact us at:
        </p>
        <p>
          Email: support@blinkeach.com
          <br />
          Address: Data Protection Officer, Blinkeach Headquarters, WARD NO. 07,
          KB LANE, NEAR CHAURAHA MASJID, PANCHAYATI AKHARA Gaya BIHAR 823001,
          India
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
