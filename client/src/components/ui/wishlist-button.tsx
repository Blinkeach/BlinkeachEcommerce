import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/hooks/use-wishlist';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function WishlistButton({ productId, className, size = 'md' }: WishlistButtonProps) {
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist, isAdding, isRemoving } = useWishlist();

  if (!user) {
    return null; // Don't show wishlist button if user is not authenticated
  }

  const isInUserWishlist = isInWishlist(productId);
  const isLoading = isAdding || isRemoving;

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(productId);
      }}
      disabled={isLoading}
      className={cn(
        sizeClasses[size],
        'rounded-full bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-200',
        'border border-gray-200 shadow-sm hover:shadow-md',
        'group',
        className
      )}
      title={isInUserWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        size={iconSizes[size]}
        className={cn(
          'transition-all duration-200',
          isInUserWishlist
            ? 'fill-red-500 text-red-500'
            : 'text-gray-600 group-hover:text-red-500',
          isLoading && 'animate-pulse'
        )}
      />
    </Button>
  );
}