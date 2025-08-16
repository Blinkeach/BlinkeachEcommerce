import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';

// Define available languages with their codes, names and flag emojis
export const languages = {
  en: { name: 'English', flag: '🇬🇧' },
  hi: { name: 'हिंदी', flag: '🇮🇳' },
  bn: { name: 'বাংলা', flag: '🇧🇩' },
  ta: { name: 'தமிழ்', flag: '🇮🇳' },
  te: { name: 'తెలుగు', flag: '🇮🇳' },
  kn: { name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  ml: { name: 'മലയാളം', flag: '🇮🇳' },
  mr: { name: 'मराठी', flag: '🇮🇳' },
  pa: { name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  gu: { name: 'ગુજરાતી', flag: '🇮🇳' },
};

export type LanguageCode = keyof typeof languages;

// Translation dictionaries
export const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Common
    'welcome': 'Welcome to Blinkeach',
    'search': 'Search',
    'login': 'Login',
    'register': 'Register',
    'logout': 'Logout',
    'cart': 'Cart',
    'profile': 'Profile',
    'settings': 'Settings',
    'orders': 'Orders',
    'wishlist': 'Wishlist',
    'new_customer': 'New Customer?',
    'sign_up': 'Sign Up',
    'customer_service': 'Customer Service',
    'track_order': 'Track Order',
    'sell_on_blinkeach': 'Sell on Blinkeach',
    'language': 'Language',
    
    // Home page
    'deals_of_the_day': 'Deals of the Day',
    'top_selling_products': 'Top Selling Products',
    'shop_by_category': 'Shop by Category',
    'view_all': 'View All',
    'view_details': 'View Details',
    'add_to_cart': 'Add to Cart',
    
    // Product
    'add_to_wishlist': 'Add to Wishlist',
    'specifications': 'Specifications',
    'related_products': 'Related Products',
    'product_description': 'Product Description',
    'customer_reviews': 'Customer Reviews',
    'sold_by': 'Sold by',
    'in_stock': 'In Stock',
    'out_of_stock': 'Out of Stock',
    'quantity': 'Quantity',
    
    // Cart
    'shopping_cart': 'Shopping Cart',
    'empty_cart': 'Your cart is empty',
    'continue_shopping': 'Continue Shopping',
    'proceed_to_checkout': 'Proceed to Checkout',
    'subtotal': 'Subtotal',
    'total': 'Total',
    'remove': 'Remove',
    
    // Checkout
    'checkout': 'Checkout',
    'shipping_address': 'Shipping Address',
    'payment_method': 'Payment Method',
    'order_summary': 'Order Summary',
    'place_order': 'Place Order',
    'shipping_fee': 'Shipping Fee',
    'tax': 'Tax',
    
    // Account
    'account_settings': 'Account Settings',
    'personal_information': 'Personal Information',
    'address_book': 'Address Book',
    'payment_methods': 'Payment Methods',
    'order_history': 'Order History',
    'my_orders': 'My Orders',
    'my_wishlist': 'My Wishlist',
    'my_reviews': 'My Reviews',
    'sell_on_platform': 'Sell on Blinkeach',
    
    // Authentication
    'email': 'Email',
    'password': 'Password',
    'forgot_password': 'Forgot Password?',
    'sign_in': 'Sign In',
    'sign_in_with_google': 'Sign In with Google',
    'sign_in_with_facebook': 'Sign In with Facebook',
    'dont_have_account': 'Don\'t have an account?',
    'already_have_account': 'Already have an account?',
    'create_account': 'Create Account',
    'full_name': 'Full Name',
    'phone_number': 'Phone Number',
    'confirm_password': 'Confirm Password',
    'terms_condition': 'I agree to the Terms and Conditions',
    
    // Seller
    'seller_dashboard': 'Seller Dashboard',
    'add_product': 'Add Product',
    'manage_products': 'Manage Products',
    'seller_orders': 'Orders',
    'seller_payments': 'Payments',
    'become_seller': 'Become a Seller',
    
    // Admin
    'admin_dashboard': 'Admin Dashboard',
    'manage_users': 'Manage Users',
    'manage_sellers': 'Manage Sellers',
    'manage_categories': 'Manage Categories',
    'site_settings': 'Site Settings',
    
    // Footer
    'about_us': 'About Us',
    'contact_us': 'Contact Us',
    'careers': 'Careers',
    'privacy_policy': 'Privacy Policy',
    'terms_of_service': 'Terms of Service',
    'shipping_policy': 'Shipping Policy',
    'return_policy': 'Return Policy',
    'faq': 'FAQ',
    'help_center': 'Help Center',
    'social_media': 'Social Media',
    'newsletter': 'Newsletter',
    'subscribe': 'Subscribe',
  },
  
  hi: {
    // Common
    'welcome': 'ब्लिंकईच में आपका स्वागत है',
    'search': 'खोज',
    'login': 'लॉगिन',
    'register': 'रजिस्टर',
    'logout': 'लॉगआउट',
    'cart': 'कार्ट',
    'profile': 'प्रोफाइल',
    'settings': 'सेटिंग्स',
    'orders': 'ऑर्डर्स',
    'wishlist': 'विशलिस्ट',
    'new_customer': 'नए ग्राहक?',
    'sign_up': 'साइन अप',
    'customer_service': 'ग्राहक सेवा',
    'track_order': 'ऑर्डर ट्रैक करें',
    'sell_on_blinkeach': 'ब्लिंकईच पर बेचें',
    'language': 'भाषा',
    
    // Home page
    'deals_of_the_day': 'आज के ऑफर्स',
    'top_selling_products': 'टॉप सेलिंग प्रोडक्ट्स',
    'shop_by_category': 'श्रेणी के अनुसार खरीदें',
    'view_all': 'सभी देखें',
    'view_details': 'विवरण देखें',
    'add_to_cart': 'कार्ट में जोड़ें',
    
    // Product
    'add_to_wishlist': 'विशलिस्ट में जोड़ें',
    'specifications': 'स्पेसिफिकेशन्स',
    'related_products': 'संबंधित प्रोडक्ट्स',
    'product_description': 'प्रोडक्ट विवरण',
    'customer_reviews': 'ग्राहक समीक्षाएँ',
    'sold_by': 'बेचने वाला',
    'in_stock': 'स्टॉक में',
    'out_of_stock': 'स्टॉक में नहीं',
    'quantity': 'मात्रा',
    
    // Cart
    'shopping_cart': 'शॉपिंग कार्ट',
    'empty_cart': 'आपका कार्ट खाली है',
    'continue_shopping': 'शॉपिंग जारी रखें',
    'proceed_to_checkout': 'चेकआउट करें',
    'subtotal': 'सबटोटल',
    'total': 'कुल',
    'remove': 'हटाएं',
    
    // Checkout
    'checkout': 'चेकआउट',
    'shipping_address': 'शिपिंग पता',
    'payment_method': 'भुगतान का तरीका',
    'order_summary': 'ऑर्डर सारांश',
    'place_order': 'ऑर्डर करें',
    'shipping_fee': 'शिपिंग शुल्क',
    'tax': 'कर',
    
    // Account
    'account_settings': 'अकाउंट सेटिंग्स',
    'personal_information': 'व्यक्तिगत जानकारी',
    'address_book': 'पता पुस्तिका',
    'payment_methods': 'भुगतान विधियां',
    'order_history': 'ऑर्डर इतिहास',
    'my_orders': 'मेरे ऑर्डर्स',
    'my_wishlist': 'मेरी विशलिस्ट',
    'my_reviews': 'मेरी समीक्षाएँ',
    'sell_on_platform': 'ब्लिंकईच पर बेचें',
    
    // Authentication
    'email': 'ईमेल',
    'password': 'पासवर्ड',
    'forgot_password': 'पासवर्ड भूल गए?',
    'sign_in': 'साइन इन',
    'sign_in_with_google': 'Google के साथ साइन इन करें',
    'sign_in_with_facebook': 'Facebook के साथ साइन इन करें',
    'dont_have_account': 'अकाउंट नहीं है?',
    'already_have_account': 'पहले से ही अकाउंट है?',
    'create_account': 'अकाउंट बनाएं',
    'full_name': 'पूरा नाम',
    'phone_number': 'फोन नंबर',
    'confirm_password': 'पासवर्ड की पुष्टि करें',
    'terms_condition': 'मैं नियम और शर्तों से सहमत हूं',
    
    // Seller
    'seller_dashboard': 'विक्रेता डैशबोर्ड',
    'add_product': 'प्रोडक्ट जोड़ें',
    'manage_products': 'प्रोडक्ट्स प्रबंधित करें',
    'seller_orders': 'ऑर्डर्स',
    'seller_payments': 'भुगतान',
    'become_seller': 'विक्रेता बनें',
    
    // Admin
    'admin_dashboard': 'एडमिन डैशबोर्ड',
    'manage_users': 'उपयोगकर्ताओं का प्रबंधन',
    'manage_sellers': 'विक्रेताओं का प्रबंधन',
    'manage_categories': 'श्रेणियों का प्रबंधन',
    'site_settings': 'साइट सेटिंग्स',
    
    // Footer
    'about_us': 'हमारे बारे में',
    'contact_us': 'संपर्क करें',
    'careers': 'करियर',
    'privacy_policy': 'गोपनीयता नीति',
    'terms_of_service': 'सेवा की शर्तें',
    'shipping_policy': 'शिपिंग नीति',
    'return_policy': 'वापसी नीति',
    'faq': 'अक्सर पूछे जाने वाले प्रश्न',
    'help_center': 'सहायता केंद्र',
    'social_media': 'सोशल मीडिया',
    'newsletter': 'न्यूज़लेटर',
    'subscribe': 'सब्सक्राइब',
  },
  
  bn: {
    // Common
    'welcome': 'ব্লিঙ্কিচে আপনাকে স্বাগতম',
    'search': 'খুঁজুন',
    'login': 'লগইন',
    'register': 'নিবন্ধন',
    'logout': 'লগআউট',
    'cart': 'কার্ট',
    'profile': 'প্রোফাইল',
    'settings': 'সেটিংস',
    'orders': 'অর্ডার',
    'wishlist': 'ইচ্ছেতালিকা',
    'new_customer': 'নতুন গ্রাহক?',
    'sign_up': 'সাইন আপ',
    'customer_service': 'গ্রাহক সেবা',
    'track_order': 'অর্ডার ট্র্যাক করুন',
    'sell_on_blinkeach': 'ব্লিঙ্কিচে বিক্রয় করুন',
    'language': 'ভাষা',
    
    // Home page
    'deals_of_the_day': 'আজকের অফার',
    'top_selling_products': 'সর্বাধিক বিক্রিত পণ্য',
    'shop_by_category': 'বিভাগ অনুসারে কেনাকাটা করুন',
    'view_all': 'সব দেখুন',
    'view_details': 'বিস্তারিত দেখুন',
    'add_to_cart': 'কার্টে যোগ করুন',
    
    // Product
    'add_to_wishlist': 'ইচ্ছেতালিকায় যোগ করুন',
    'specifications': 'বিবরণ',
    'related_products': 'সম্পর্কিত পণ্য',
    'product_description': 'পণ্যের বিবরণ',
    'customer_reviews': 'গ্রাহক রিভিউ',
    'sold_by': 'বিক্রেতা',
    'in_stock': 'স্টকে আছে',
    'out_of_stock': 'স্টকে নেই',
    'quantity': 'পরিমাণ',
    
    // Cart
    'shopping_cart': 'কেনাকাটার কার্ট',
    'empty_cart': 'আপনার কার্ট খালি',
    'continue_shopping': 'কেনাকাটা অবিরত রাখুন',
    'proceed_to_checkout': 'চেকআউট করুন',
    'subtotal': 'সাবটোটাল',
    'total': 'মোট',
    'remove': 'সরান',
    
    // Checkout
    'checkout': 'চেকআউট',
    'shipping_address': 'শিপিং ঠিকানা',
    'payment_method': 'পেমেন্ট পদ্ধতি',
    'order_summary': 'অর্ডার সারাংশ',
    'place_order': 'অর্ডার করুন',
    'shipping_fee': 'শিপিং ফি',
    'tax': 'কর',
    
    // Account
    'account_settings': 'অ্যাকাউন্ট সেটিংস',
    'personal_information': 'ব্যক্তিগত তথ্য',
    'address_book': 'ঠিকানা বই',
    'payment_methods': 'পেমেন্ট পদ্ধতি',
    'order_history': 'অর্ডার ইতিহাস',
    'my_orders': 'আমার অর্ডার',
    'my_wishlist': 'আমার ইচ্ছেতালিকা',
    'my_reviews': 'আমার রিভিউ',
    'sell_on_platform': 'ব্লিঙ্কিচে বিক্রয় করুন',
    
    // Authentication
    'email': 'ইমেইল',
    'password': 'পাসওয়ার্ড',
    'forgot_password': 'পাসওয়ার্ড ভুলে গেছেন?',
    'sign_in': 'সাইন ইন',
    'sign_in_with_google': 'Google দিয়ে সাইন ইন করুন',
    'sign_in_with_facebook': 'Facebook দিয়ে সাইন ইন করুন',
    'dont_have_account': 'অ্যাকাউন্ট নেই?',
    'already_have_account': 'ইতিমধ্যে অ্যাকাউন্ট আছে?',
    'create_account': 'অ্যাকাউন্ট তৈরি করুন',
    'full_name': 'পুরো নাম',
    'phone_number': 'ফোন নম্বর',
    'confirm_password': 'পাসওয়ার্ড নিশ্চিত করুন',
    'terms_condition': 'আমি নিয়ম ও শর্তাবলীতে সম্মত',
    
    // Seller
    'seller_dashboard': 'বিক্রেতা ড্যাশবোর্ড',
    'add_product': 'পণ্য যোগ করুন',
    'manage_products': 'পণ্য পরিচালনা করুন',
    'seller_orders': 'অর্ডার',
    'seller_payments': 'পেমেন্ট',
    'become_seller': 'বিক্রেতা হন',
    
    // Admin
    'admin_dashboard': 'অ্যাডমিন ড্যাশবোর্ড',
    'manage_users': 'ব্যবহারকারী পরিচালনা',
    'manage_sellers': 'বিক্রেতা পরিচালনা',
    'manage_categories': 'বিভাগ পরিচালনা',
    'site_settings': 'সাইট সেটিংস',
    
    // Footer
    'about_us': 'আমাদের সম্পর্কে',
    'contact_us': 'যোগাযোগ করুন',
    'careers': 'ক্যারিয়ার',
    'privacy_policy': 'গোপনীয়তা নীতি',
    'terms_of_service': 'সেবার শর্তাবলী',
    'shipping_policy': 'শিপিং নীতি',
    'return_policy': 'রিটার্ন নীতি',
    'faq': 'সাধারণ জিজ্ঞাসা',
    'help_center': 'সাহায্য কেন্দ্র',
    'social_media': 'সোশ্যাল মিডিয়া',
    'newsletter': 'নিউজলেটার',
    'subscribe': 'সাবস্ক্রাইব',
  },
  
  // Add simplified/sample translations for other languages
  ta: { 
    'welcome': 'பிளிங்கீச்சுக்கு வரவேற்கிறோம்',
    'search': 'தேடு',
    'login': 'உள்நுழைக',
    'cart': 'கார்ட்',
    // Add other translations as needed
  },
  
  te: { 
    'welcome': 'బ్లింకీచ్‌కి స్వాగతం',
    'search': 'వెతకండి',
    'login': 'లాగిన్',
    'cart': 'కార్ట్',
    // Add other translations as needed 
  },
  
  kn: { 
    'welcome': 'ಬ್ಲಿಂಕೀಚ್‌ಗೆ ಸುಸ್ವಾಗತ',
    'search': 'ಹುಡುಕಿ',
    'login': 'ಲಾಗಿನ್',
    'cart': 'ಕಾರ್ಟ್',
    // Add other translations as needed
  },
  
  ml: { 
    'welcome': 'ബ്ലിങ്കീചിലേക്ക് സ്വാഗതം',
    'search': 'തിരയുക',
    'login': 'ലോഗിൻ',
    'cart': 'കാർട്ട്',
    // Add other translations as needed
  },
  
  mr: { 
    'welcome': 'ब्लिंकीचमध्ये आपले स्वागत आहे',
    'search': 'शोधा',
    'login': 'लॉगिन',
    'cart': 'कार्ट',
    // Add other translations as needed
  },
  
  pa: { 
    'welcome': 'ਬਲਿੰਕੀਚ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ',
    'search': 'ਖੋਜ',
    'login': 'ਲੌਗਿਨ',
    'cart': 'ਕਾਰਟ',
    // Add other translations as needed
  },
  
  gu: { 
    'welcome': 'બ્લિંકીચમાં આપનું સ્વાગત છે',
    'search': 'શોધો',
    'login': 'લૉગિન',
    'cart': 'કાર્ટ',
    // Add other translations as needed
  },
};

// Define the context types
interface LanguageContextType {
  currentLanguage: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: string) => string;
}

// Create language context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Define language provider properties
interface LanguageProviderProps {
  children: ReactNode;
}

// The cookie name where we'll store the language preference
const LANGUAGE_COOKIE_NAME = 'blinkeach_language';

// Language provider component
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Initialize with 'en' or a stored cookie value
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');

  // Load language preference from cookie on initial render
  useEffect(() => {
    const savedLanguage = Cookies.get(LANGUAGE_COOKIE_NAME) as LanguageCode | undefined;
    
    if (savedLanguage && Object.keys(languages).includes(savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0] as LanguageCode;
      if (Object.keys(languages).includes(browserLang)) {
        setCurrentLanguage(browserLang);
      }
    }
  }, []);

  // Set language and save to cookie
  const setLanguage = (code: LanguageCode) => {
    setCurrentLanguage(code);
    Cookies.set(LANGUAGE_COOKIE_NAME, code, { expires: 365 }); // Cookie expires in 1 year
  };

  // Translation function
  const t = (key: string): string => {
    if (translations[currentLanguage]?.[key]) {
      return translations[currentLanguage][key];
    }
    
    // Fallback to English if translation is missing
    if (translations.en[key]) {
      return translations.en[key];
    }
    
    // Return the key itself if no translation exists
    return key;
  };

  // Provide the language context to children
  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};