import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useQuery } from '@tanstack/react-query';

// Define the interface for our product
export interface RecentlyViewedProduct {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  discount?: number;
  badge?: {
    text: string;
    color: string;
  };
  stock?: number;
}

// Cookie key for storing recently viewed products
const RECENTLY_VIEWED_COOKIE = 'recently_viewed_products';
// Maximum number of products to store
const MAX_RECENTLY_VIEWED = 10;

export function useRecentlyViewed() {
  // State to track recently viewed product IDs
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<number[]>([]);
  // State to store the actual product data
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<RecentlyViewedProduct[]>([]);

  // Load recently viewed product IDs from cookies on initial render
  useEffect(() => {
    const cookieData = Cookies.get(RECENTLY_VIEWED_COOKIE);
    if (cookieData) {
      try {
        const parsedIds = JSON.parse(cookieData);
        setRecentlyViewedIds(Array.isArray(parsedIds) ? parsedIds : []);
      } catch (error) {
        console.error('Error parsing recently viewed products cookie:', error);
        setRecentlyViewedIds([]);
      }
    }
  }, []);

  // Fetch product details for all recently viewed IDs
  const { data: products = [] } = useQuery<RecentlyViewedProduct[]>({
    queryKey: ['/api/products/details', recentlyViewedIds],
    queryFn: async () => {
      if (recentlyViewedIds.length === 0) return [];
      
      try {
        const response = await fetch(`/api/products/details?ids=${recentlyViewedIds.join(',')}`);
        if (!response.ok) throw new Error('Failed to fetch recently viewed products');
        return await response.json();
      } catch (error) {
        console.error('Error fetching recently viewed products:', error);
        return [];
      }
    },
    enabled: recentlyViewedIds.length > 0,
  });

  // Update the recentlyViewedProducts state when products data changes
  useEffect(() => {
    if (products.length > 0) {
      // Sort products based on the order in recentlyViewedIds
      const orderedProducts = [...products].sort((a, b) => {
        return recentlyViewedIds.indexOf(a.id) - recentlyViewedIds.indexOf(b.id);
      });
      setRecentlyViewedProducts(orderedProducts);
    }
  }, [products, recentlyViewedIds]);

  // Function to add a product to recently viewed
  const addToRecentlyViewed = (productId: number) => {
    setRecentlyViewedIds(prevIds => {
      // Remove the product ID if it already exists
      const filteredIds = prevIds.filter(id => id !== productId);
      
      // Add the new ID at the beginning (most recent)
      const newIds = [productId, ...filteredIds].slice(0, MAX_RECENTLY_VIEWED);
      
      // Update the cookie
      Cookies.set(RECENTLY_VIEWED_COOKIE, JSON.stringify(newIds), { expires: 30 }); // 30 days expiry
      
      return newIds;
    });
  };

  // Function to clear recently viewed products
  const clearRecentlyViewed = () => {
    setRecentlyViewedIds([]);
    setRecentlyViewedProducts([]);
    Cookies.remove(RECENTLY_VIEWED_COOKIE);
  };

  return {
    recentlyViewedProducts,
    addToRecentlyViewed,
    clearRecentlyViewed,
    isLoading: recentlyViewedIds.length > 0 && products.length === 0
  };
}