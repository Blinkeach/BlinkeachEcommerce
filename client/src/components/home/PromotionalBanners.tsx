import React from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface BannerProps {
  titleKey: string;
  descriptionKey: string;
  image: string;
  buttonTextKey: string;
  buttonLink: string;
  colorClass: string;
  textClass: string;
}

const PromotionalBanners: React.FC = () => {
  const { t } = useTranslation();

  const banners: BannerProps[] = [
    {
      titleKey: 'promotions.festival_sale.title',
      descriptionKey: 'promotions.festival_sale.description',
      image: 'https://images.unsplash.com/photo-1583391733981-8698e5f9deb8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      buttonTextKey: 'promotions.shop_now',
      buttonLink: '/shop?category=fashion&filter=festival',
      colorClass: 'from-secondary to-secondary-light',
      textClass: 'text-secondary'
    },
    {
      titleKey: 'promotions.gadget_sale.title',
      descriptionKey: 'promotions.gadget_sale.description',
      image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      buttonTextKey: 'promotions.explore',
      buttonLink: '/shop?category=electronics',
      colorClass: 'from-accent to-accent-light',
      textClass: 'text-accent'
    }
  ];

  return (
    <section className="py-6 px-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((banner, index) => (
          <div 
            key={index} 
            className={`bg-gradient-to-r ${banner.colorClass} rounded-lg overflow-hidden shadow-sm`}
          >
            <div className="flex flex-col md:flex-row items-center p-4 md:p-6">
              <div className="md:w-1/2 text-white mb-4 md:mb-0">
                <h3 className="font-bold text-xl md:text-2xl mb-2">{t(banner.titleKey)}</h3>
                <p className="text-white/90 mb-3">{t(banner.descriptionKey)}</p>
                <Link href={banner.buttonLink}>
                  <Button 
                    className={`bg-white ${banner.textClass} font-medium py-1.5 px-4 rounded hover:bg-neutral-100 transition-colors`}
                  >
                    {t(banner.buttonTextKey)}
                  </Button>
                </Link>
              </div>
              <div className="md:w-1/2">
                <img 
                  src={banner.image} 
                  alt={t(banner.titleKey)}
                  className="w-full h-36 object-cover rounded"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PromotionalBanners;
