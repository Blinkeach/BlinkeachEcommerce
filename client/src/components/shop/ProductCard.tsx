import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingCart, Star, StarHalf, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WishlistButton } from '@/components/ui/wishlist-button';
import { useCart } from '@/lib/cart';
import { useToast } from '@/hooks/use-toast';
import ShareModal from './ShareModal';

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  discount?: number; // If manually provided, will use this instead of calculating
  badge?: {
    text: string;
    color: string;
  };
  stock?: number; // Added stock property
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  originalPrice,
  image,
  rating,
  reviewCount,
  discount: providedDiscount,
  badge,
  stock = 0
}) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Calculate discount percentage if original price is provided and no discount was explicitly given
  const calculateDiscount = (): number | undefined => {
    if (!originalPrice || originalPrice <= price) return undefined;
    
    // Calculate discount percentage: (originalPrice - price) / originalPrice * 100
    const discountPercentage = Math.round((originalPrice - price) / originalPrice * 100);
    return discountPercentage > 0 ? discountPercentage : undefined;
  };
  
  // Use provided discount or calculate it
  const discount = providedDiscount || calculateDiscount();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Redirect to product details page with alert message
    toast({
      title: "Please select options",
      description: "Select color and size on the product details page",
      duration: 3000,
    });
    
    setLocation(`/product/${id}`);
  };

  // Generate stars for rating
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="h-3.5 w-3.5 fill-green-500 text-green-500" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="h-3.5 w-3.5 fill-green-500 text-green-500" />);
    }
    
    const remainingStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-star-${i}`} className="h-3.5 w-3.5 text-green-500" />);
    }
    
    return stars;
  };

  return (
    <Link href={`/product/${id}`}>
      <div className="block cursor-pointer h-full">
        <div className="bg-white rounded-md shadow-sm hover:shadow-md transition-shadow p-3 group h-full flex flex-col">
          <div className="relative mb-3">
            {(discount || badge) && (
              <span 
                className={`absolute top-0 left-0 ${badge?.color || 'bg-red-600'} text-white text-xs px-2 py-1 rounded-br-md font-medium z-10`}
              >
                {badge?.text || `-${discount}%`}
              </span>
            )}
            <div className="w-full h-40 relative bg-gray-50 rounded-md overflow-hidden">
              <img 
                src={image} 
                alt={name} 
                className="w-full h-full object-contain"
                loading="lazy"
                onError={(e) => {
                  // Just hide the broken image and let CSS handle the fallback
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              {/* Fallback div that shows when image fails to load */}
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm absolute inset-0 -z-10">
                Product Image
              </div>
            </div>
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <WishlistButton productId={id} size="sm" />
            </div>
          </div>
          
          {/* Content section with flex-grow to push buttons to bottom */}
          <div className="flex-1 flex flex-col">
            <h3 className="font-medium text-sm line-clamp-2 mb-2 min-h-[2.5rem] leading-tight">{name}</h3>
            
            <div className="flex items-center mb-2 text-xs">
              <div className="flex text-amber-400">
                {renderStars()}
              </div>
              <span className="text-neutral-500 ml-1 truncate">
                ({reviewCount})
                {reviewCount === 0 && <span className="hidden sm:inline"> (Default rating set by admin)</span>}
              </span>
              <span className="mx-1 text-neutral-300">|</span>
              {stock > 0 ? (
                <span className="text-green-600 whitespace-nowrap">In Stock</span>
              ) : (
                <span className="text-red-500 whitespace-nowrap">Out of Stock</span>
              )}
            </div>
            
            {/* Price section with flex-grow to push buttons to bottom */}
            <div className="flex-1 flex flex-col justify-end">
              <div className="mb-3">
                <div className="flex items-end flex-wrap gap-1">
                  <span className="font-semibold text-base text-gray-900">₹{(price/100).toLocaleString('en-IN')}</span>
                  {originalPrice && originalPrice > price && (
                    <>
                      <span className="line-through text-neutral-500 text-sm">
                        ₹{(originalPrice/100).toLocaleString('en-IN')}
                      </span>
                      {discount && discount > 0 && (
                        <span className="text-red-600 text-xs font-medium">
                          {discount}% off
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Buttons always at the bottom */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddToCart} 
                  className="flex-1 bg-primary hover:bg-primary-dark text-white py-2 px-3 rounded text-sm font-medium transition-colors h-9"
                  disabled={stock === 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Add to Cart
                </Button>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShareModalOpen(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="px-2 h-9 flex-shrink-0"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        productName={name}
        productUrl={`${window.location.origin}/product/${id}`}
        productImage={image}
        productPrice={price}
        productId={id}
      />
    </Link>
  );
};

export default ProductCard;
