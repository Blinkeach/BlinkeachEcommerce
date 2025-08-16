import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { WishlistItem, Product } from '@shared/schema';

export function useWishlist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's wishlist
  const { data: wishlistItems = [], isLoading } = useQuery<(WishlistItem & { product: Product })[]>({
    queryKey: ['/api/wishlist'],
  });

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiRequest('POST', '/api/wishlist', { productId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({
        title: "Added to wishlist",
        description: "Product has been added to your wishlist",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add to wishlist",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiRequest('DELETE', `/api/wishlist/${productId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({
        title: "Removed from wishlist",
        description: "Product has been removed from your wishlist",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove from wishlist",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if product is in wishlist
  const isInWishlist = (productId: number) => {
    return wishlistItems.some(item => item.productId === productId);
  };

  // Toggle wishlist status
  const toggleWishlist = (productId: number) => {
    if (isInWishlist(productId)) {
      removeFromWishlistMutation.mutate(productId);
    } else {
      addToWishlistMutation.mutate(productId);
    }
  };

  return {
    wishlistItems,
    isLoading,
    addToWishlist: addToWishlistMutation.mutate,
    removeFromWishlist: removeFromWishlistMutation.mutate,
    toggleWishlist,
    isInWishlist,
    isAdding: addToWishlistMutation.isPending,
    isRemoving: removeFromWishlistMutation.isPending,
  };
}