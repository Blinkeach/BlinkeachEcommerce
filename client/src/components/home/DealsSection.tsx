import React from 'react';
import { Link } from 'wouter';
import ProductCard from '@/components/shop/ProductCard';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Tag, ArrowRight } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  rating: number;
  reviewCount: number;
  discount: number;
}

const DealsSection: React.FC = () => {
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['/api/products/deals']
  });

  // Fallback data for development
  const fallbackProducts = [
    {
      id: 1,
      name: 'OnePlus Nord CE 3 Lite 5G (8GB RAM, 128GB Storage)',
      price: 16999,
      originalPrice: 24999,
      image: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      rating: 4.5,
      reviewCount: 2345,
      discount: 45
    },
    {
      id: 2,
      name: 'Fire-Boltt Ninja Smart Watch with Bluetooth Calling',
      price: 1999,
      originalPrice: 3499,
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      rating: 4.0,
      reviewCount: 1234,
      discount: 35
    },
    {
      id: 3,
      name: 'boAt Rockerz 450 Bluetooth On-Ear Headphones',
      price: 1499,
      originalPrice: 2999,
      image: 'https://images.unsplash.com/photo-1600086827875-a63b01f5aff7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      rating: 4.5,
      reviewCount: 3421,
      discount: 50
    },
    {
      id: 4,
      name: 'Campus Men\'s Running Shoes - Lightweight & Comfortable',
      price: 899,
      originalPrice: 1499,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      rating: 3.5,
      reviewCount: 987,
      discount: 40
    },
    {
      id: 5,
      name: 'JBL Flip 5 Waterproof Portable Bluetooth Speaker',
      price: 8499,
      originalPrice: 11999,
      image: 'https://images.unsplash.com/photo-1596460107916-430662021049?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      rating: 5.0,
      reviewCount: 2876,
      discount: 30
    }
  ];

  // Use fallback data if still loading or error
  const displayProducts = Array.isArray(products) && products.length > 0 ? products : fallbackProducts;

  return (
    <section className="py-6 px-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="p-2 rounded-md mr-3 bg-red-50">
            <Tag className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center">
              Deal of the Day
              <div className="h-1 w-10 ml-3 rounded-full bg-red-500"></div>
            </h2>
          </div>
        </div>
        <Link href="/shop?filter=deals">
          <div className="group flex items-center px-4 py-2 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:from-primary/90 hover:to-primary transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer">
            <span className="text-sm font-medium mr-2">View All</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array(5).fill(0).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-40 w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayProducts.map((product, index) => (
            <div 
              key={product.id} 
              className="opacity-0 animate-fade-in-up transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{ 
                animationDelay: `${index * 150}ms`,
                animationFillMode: 'forwards'
              }}
            >
              <ProductCard
                id={product.id}
                name={product.name}
                price={product.price}
                originalPrice={product.originalPrice}
                image={product.image}
                rating={product.rating}
                reviewCount={product.reviewCount}
                discount={product.discount}
              />
            </div>
          ))}
        </div>
      )}
      

    </section>
  );
};

export default DealsSection;
