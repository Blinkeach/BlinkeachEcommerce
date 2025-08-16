import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import ShopPage from "@/pages/ShopPage";
import ProductPage from "@/pages/ProductPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrderConfirmationPage from "@/pages/OrderConfirmationPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import OTPVerificationPage from "@/pages/OTPVerificationPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import AdminPage from "@/pages/AdminPage";
import AuthSuccessPage from "@/pages/AuthSuccessPage";
import ProfilePage from "@/pages/ProfilePage";
import OrdersPage from "@/pages/OrdersPage";

// Import footer policy pages
import AboutUsPage from "@/pages/AboutUsPage";
import ContactUsPage from "@/pages/ContactUsPage";
import TermsAndConditionsPage from "@/pages/TermsAndConditionsPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import ShippingPolicyPage from "@/pages/ShippingPolicyPage";
import ReturnRefundPolicyPage from "@/pages/ReturnRefundPolicyPage";

// Import customer service pages
import TrackOrderPage from "@/pages/TrackOrderPage";
import TrackingPage from "@/pages/TrackingPage";
import WishlistPage from "@/pages/WishlistPage";
import HelpFaqPage from "@/pages/HelpFaqPage";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageTransition from "@/components/layout/PageTransition";
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/hooks/use-auth";
import { LanguageProvider } from "@/context/LanguageContext";
import { RouteChangeProvider } from "@/context/RouteChangeContext";
import { ProtectedRoute } from "@/lib/protected-route";
import { Suspense, lazy, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import LiveChatWidget from "@/components/support/LiveChatWidget";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { FullPageLoader } from "@/components/ui/full-page-loader";
import { LazyLoader } from "@/components/ui/lazy-loader";
import ScrollToTop from "@/components/common/ScrollToTop";

const Chatbot = lazy(() => import("@/components/layout/Chatbot"));

function Loading() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-100">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-secondary animate-spin mb-4" />
          <h1 className="text-xl font-bold text-neutral-800">Loading...</h1>
        </CardContent>
      </Card>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Main Pages */}
      <Route path="/" component={HomePage} />
      <Route path="/shop" component={ShopPage} />
      <Route path="/shop/:category" component={ShopPage} />
      <Route path="/product/:id" component={ProductPage} />
      <Route path="/cart" component={CartPage} />
      <ProtectedRoute path="/checkout" component={CheckoutPage} />
      <Route path="/order-confirmation" component={OrderConfirmationPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/verify-email" component={OTPVerificationPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <ProtectedRoute path="/admin/:tab?" component={AdminPage} adminOnly={true} />
      
      {/* Footer Policy Pages */}
      <Route path="/about-us" component={AboutUsPage} />
      <Route path="/contact-us" component={ContactUsPage} />
      <Route path="/terms-and-conditions" component={TermsAndConditionsPage} />
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route path="/shipping-policy" component={ShippingPolicyPage} />
      <Route path="/return-refund-policy" component={ReturnRefundPolicyPage} />
      
      {/* Customer Service Pages */}
      <ProtectedRoute path="/track-order" component={TrackOrderPage} />
      <Route path="/tracking" component={TrackingPage} />
      <ProtectedRoute path="/orders" component={OrdersPage} />
      <ProtectedRoute path="/wishlist" component={WishlistPage} />
      <Route path="/help-faq" component={HelpFaqPage} />
      
      {/* 404 - Not Found */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Render the main layout with header and footer for all routes except auth/success
function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <PageTransition transitionKey={location}>
          {children}
        </PageTransition>
      </main>
      <Footer />
      <LiveChatWidget />
    </div>
  );
}

function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Simulate initial loading state
  useEffect(() => {
    // Show the loader for at least 2 seconds for good UX
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <RouteChangeProvider>
            <CartProvider>
              {/* Initial page loader */}
              {isInitialLoading ? (
                <FullPageLoader />
              ) : (
                <>
                  <ScrollToTop />
                  <LoadingIndicator position="top" />
                  
                  <Switch>
                    {/* Special case for auth success page - no header/footer */}
                    <Route path="/auth/success">
                      <AuthSuccessPage />
                    </Route>
                    
                    {/* All other routes get the main layout */}
                    <Route>
                      <MainLayout>
                        <Router />
                      </MainLayout>
                    </Route>
                  </Switch>
                  
                  <Suspense fallback={<LazyLoader />}>
                    <Chatbot />
                  </Suspense>
                  <Toaster />
                </>
              )}
            </CartProvider>
          </RouteChangeProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
