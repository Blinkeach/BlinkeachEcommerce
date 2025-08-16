import React from "react";
import { Link } from "wouter";
import Logo from "@/components/icons/Logo";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-800 text-white pt-10 pb-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {t("about blinkeach")}
            </h3>
            <p className="text-neutral-400 text-sm mb-4">
              {t("footer.about_text")}
            </p>
            <div className="flex space-x-3">
              <a
                href="https://www.facebook.com/blinkeach"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-neutral-700 hover:bg-neutral-600 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/blinkeach?igsh=OGVoOGdzOXozYzlv"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-neutral-700 hover:bg-neutral-600 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">{t("quick links")}</h3>
            <ul className="space-y-2 text-neutral-400 text-sm">
              <li>
                <Link href="/about-us">
                  <span className="hover:text-white transition-colors cursor-pointer">
                    {t("about_us")}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/contact-us">
                  <span className="hover:text-white transition-colors cursor-pointer">
                    {t("contact_us")}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions">
                  <span className="hover:text-white transition-colors cursor-pointer">
                    {t("legal.terms_conditions.title")}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy">
                  <span className="hover:text-white transition-colors cursor-pointer">
                    {t("legal.privacy_policy.title")}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy">
                  <span className="hover:text-white transition-colors cursor-pointer">
                    {t("legal.shipping.title")}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/return-refund-policy">
                  <span className="hover:text-white transition-colors cursor-pointer">
                    {t("legal.return_refund.title")}
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">
              {t("customer service")}
            </h3>
            <ul className="space-y-2 text-neutral-400 text-sm">
              <li>
                <Link href="/profile">
                  <span className="hover:text-white transition-colors cursor-pointer">
                    {t("myAccount")}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/track-order">
                  <span className="hover:text-white transition-colors cursor-pointer">
                    {t("common.track_order")}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/tracking">
                  <span className="hover:text-white transition-colors cursor-pointer">
                    Track Shipment
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/wishlist">
                  <span className="hover:text-white transition-colors cursor-pointer">
                    {t("wishlist.title")}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/cart">
                  <span className="hover:text-white transition-colors cursor-pointer">
                    {t("cart.title")}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/help-faq">
                  <span className="hover:text-white transition-colors cursor-pointer">
                    {t("help faq")}
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">{t("contact.title")}</h3>
            <ul className="space-y-3 text-neutral-400 text-sm">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-white mt-0.5 mr-3 flex-shrink-0" />
                <span>
                  WARD NO. 07, KB LANE, NEAR CHAURAHA MASJID, PANCHAYATI AKHARA
                  Gaya BIHAR 823001
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-white mr-3 flex-shrink-0" />
                <span>+91 8274019912</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-white mr-3 flex-shrink-0" />
                <span>support@blinkeach.com</span>
              </li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">
              {t("checkout.payment_methods")}
            </h3>
            <div className="flex flex-wrap gap-2">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/512px-Paytm_Logo_%28standalone%29.svg.png"
                alt="Paytm"
                className="h-6 bg-white rounded p-0.5"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png"
                alt="Mastercard"
                className="h-6 bg-white rounded p-0.5"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png"
                alt="Visa"
                className="h-6 bg-white rounded p-0.5"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/1200px-American_Express_logo_%282018%29.svg.png"
                alt="American Express"
                className="h-6 bg-white rounded p-0.5"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/124px-PayPal.svg.png"
                alt="PayPal"
                className="h-6 bg-white rounded p-0.5"
              />
              <img
                src="https://razorpay.com/favicon.png"
                alt="Razorpay"
                className="h-6 bg-white rounded p-0.5"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-700 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-neutral-400 text-sm mb-4 md:mb-0">
            © {currentYear} Blinkeach. {t("footer.all_rights_reserved")}
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-neutral-400">
            <Link href="/terms-and-conditions">
              <span className="hover:text-white transition-colors cursor-pointer">
                {t("legal.terms_short")}
              </span>
            </Link>
            <Link href="/privacy-policy">
              <span className="hover:text-white transition-colors cursor-pointer">
                {t("legal.privacy_short")}
              </span>
            </Link>
            <Link href="/help-faq">
              <span className="hover:text-white transition-colors cursor-pointer">
                {t("common.help")}
              </span>
            </Link>
            <Link href="/contact-us">
              <span className="hover:text-white transition-colors cursor-pointer">
                {t("contact_us")}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
