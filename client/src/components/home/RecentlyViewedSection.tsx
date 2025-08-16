import React, { useRef, useEffect } from 'react';
import { Link } from 'wouter';
import ProductCard from '@/components/shop/ProductCard';
import { useRecentlyViewed } from '@/hooks/use-recently-viewed';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { X, ChevronRight } from 'lucide-react';

const RecentlyViewedSection: React.FC = () => {
  const { recentlyViewedProducts, clearRecentlyViewed, isLoading } = useRecentlyViewed();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto scroll animation
  useEffect(() => {
    if (!scrollContainerRef.current || recentlyViewedProducts.length <= 4) return;
    
    const scrollContainer = scrollContainerRef.current;
    let animationFrameId: number;
    let scrollAmount = 0.5; // pixels to scroll per frame
    let isPaused = false;
    
    const autoScroll = () => {
      if (!isPaused) {
        scrollContainer.scrollLeft += scrollAmount;
        
        // Reset to beginning when reaching the end
        if (scrollContainer.scrollLeft >= 
            scrollContainer.scrollWidth - scrollContainer.clientWidth) {
          scrollContainer.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(autoScroll);
    };
    
    // Start auto-scrolling
    animationFrameId = requestAnimationFrame(autoScroll);
    
    // Pause scrolling when mouse is over the container
    const handleMouseEnter = () => { isPaused = true; };
    const handleMouseLeave = () => { isPaused = false; };
    
    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [recentlyViewedProducts.length]);

  // Don't render the section if there are no recently viewed products and not loading
  if (recentlyViewedProducts.length === 0 && !isLoading) {
    return null;
  }

  return (
    <section className="py-8 px-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="relative">
          <h2 className="text-xl md:text-2xl font-bold">Recently Viewed</h2>
          <div className="absolute -bottom-2 left-0 w-1/2 h-1 bg-secondary rounded-full"></div>
        </div>
        
        <div className="flex items-center gap-2">
          {recentlyViewedProducts.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-sm text-gray-500 hover:text-red-500 flex items-center" 
              onClick={clearRecentlyViewed}
            >
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="flex-shrink-0 w-48 sm:w-56 md:w-60 bg-white rounded-md shadow-sm p-3">
              <Skeleton className="w-full aspect-square mb-3" />
              <Skeleton className="w-3/4 h-4 mb-2" />
              <Skeleton className="w-1/2 h-4 mb-2" />
              <Skeleton className="w-1/3 h-4 mb-2" />
            </div>
          ))}
        </div>
      ) : (
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-4 pb-4 no-scrollbar"
          style={{ scrollBehavior: 'smooth' }}
        >
          {recentlyViewedProducts.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-48 sm:w-56 md:w-60">
              <Link to={`/product/${product.id}`}>
                <div className="bg-white rounded-md shadow-sm hover:shadow-md transition-shadow p-3 h-full">
                  {/* Product Image */}
                  <div className="mb-3 aspect-square overflow-hidden rounded-md bg-gray-100 flex items-center justify-center">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  {/* Product Name */}
                  <h3 className="text-sm font-medium line-clamp-2 mb-1">{product.name}</h3>
                  
                  {/* Price */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-primary">₹{Math.round(product.price / 100)}</span>
                    {product.originalPrice && (
                      <span className="text-xs text-gray-400 line-through">₹{Math.round(product.originalPrice / 100)}</span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecentlyViewedSection;