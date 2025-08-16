import React from 'react';
import ProductCard from './ProductCard';
import { Loader2 } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  rating: number;
  reviewCount: number;
  discount?: number;
  badge?: {
    text: string;
    color: string;
  };
  stock: number;
}

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  gridCols?: 2 | 3 | 4 | 5;
}

const ProductGrid: React.FC<ProductGridProps> = ({ 
  products, 
  isLoading,
  gridCols = 4
}) => {
  // Determine grid column class based on props
  const gridColClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  }[gridCols];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 text-secondary animate-spin mb-4" />
        <p className="text-neutral-500">Loading products...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-neutral-600 mb-2">No products found.</p>
        <p className="text-neutral-500 text-sm">Try adjusting your filters or search criteria.</p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridColClass} gap-4`}>
      {products.map((product) => {
        // Calculate discount percentage if not provided but has original price
        let discountPercentage = product.discount;
        if (!discountPercentage && product.originalPrice && product.originalPrice > product.price) {
          discountPercentage = Math.round(
            ((product.originalPrice - product.price) / product.originalPrice) * 100
          );
        }

        // Create badge for out of stock products
        let badge = product.badge;
        if (product.stock <= 0) {
          badge = {
            text: 'Out of Stock',
            color: 'bg-red-500'
          };
        } else if (discountPercentage && discountPercentage >= 40 && !badge) {
          badge = {
            text: `${discountPercentage}% Off`,
            color: 'bg-accent'
          };
        }

        return (
          <div key={product.id} className="h-full min-h-[400px]">
            <ProductCard
              id={product.id}
              name={product.name}
              price={product.price}
              originalPrice={product.originalPrice}
              image={product.images.find(img => img.startsWith('/uploads/')) || product.images[0] || product.image}
              rating={product.rating}
              reviewCount={product.reviewCount}
              discount={discountPercentage}
              badge={badge}
              stock={product.stock}
            />
          </div>
        );
      })}
    </div>
  );
};

export default ProductGrid;
