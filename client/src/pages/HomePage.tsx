import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import HeroSlider from '@/components/home/HeroSlider';
import CategorySection from '@/components/home/CategorySection';
import PromotionalBanners from '@/components/home/PromotionalBanners';
import FeaturesSection from '@/components/home/FeaturesSection';
import AppDownloadBanner from '@/components/home/AppDownloadBanner';
import CategoryProductsSection from '@/components/home/CategoryProductsSection';
import ProductCarousel from '@/components/home/ProductCarousel';
import RecentlyViewedSection from '@/components/home/RecentlyViewedSection';
import ProductRecommendations from '@/components/recommendations/ProductRecommendations';
import { useAuth } from '@/hooks/use-auth';
import { Helmet } from 'react-helmet';
import { Skeleton } from '@/components/ui/skeleton';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{t('welcome')} - Blinkeach</title>
        <meta name="description" content="Shop online for electronics, fashion, home appliances, and more. Great deals, fast delivery, easy returns. India's favorite shopping destination." />
      </Helmet>

      <main className="min-h-screen">
        {/* Hero Slider */}
        <HeroSlider />

        {/* Feature Categories */}
        <CategorySection />

        {/* Personalized Recommendations */}
        <section className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          <ProductRecommendations
            title={t('recommendations')}
            userId={user?.id}
            maxItems={8}
            autoPlay={true}
            showAddToCart={true}
          />
        </section>

        {/* All Products Section */}
        <CategoryProductsSection />

        {/* Product Carousel (Deals + Top Selling) */}
        <ProductCarousel />

        {/* Promotional Banners */}
        <PromotionalBanners />
        
        {/* Recently Viewed Products */}
        <RecentlyViewedSection />

        {/* Fashion Recommendations */}
        <section className="max-w-7xl mx-auto px-4 py-6 md:py-8 mb-8">
          <ProductRecommendations
            title="Fashion & Style"
            category="Fashion"
            maxItems={6}
            autoPlay={true}
            showAddToCart={true}
          />
        </section>

        {/* Features */}
        <FeaturesSection />

        {/* App Download Banner */}
        <AppDownloadBanner />
      </main>
    </>
  );
};

export default HomePage;
