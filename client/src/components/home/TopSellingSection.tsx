import React from 'react';
import { Link } from 'wouter';
import ProductCard from '@/components/shop/ProductCard';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';

const TopSellingSection: React.FC = () => {
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['/api/products/top-selling']
  });

  // Fallback data for development
  const fallbackProducts = [
    {
      id: 6,
      name: 'PlayStation 5 DualSense Wireless Controller',
      price: 5999,
      originalPrice: 6999,
      image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      rating: 5.0,
      reviewCount: 4567,
      badge: {
        text: 'Top Rated',
        color: 'bg-green-500'
      }
    },
    {
      id: 7,
      name: 'Premium Cotton Socks (Pack of 6) - Multicolor',
      price: 399,
      originalPrice: 699,
      image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      rating: 4.5,
      reviewCount: 2187,
      badge: {
        text: 'Bestseller',
        color: 'bg-accent'
      }
    },
    {
      id: 8,
      name: 'Nike Revolution 6 Running Shoes - Breathable Design',
      price: 2799,
      originalPrice: 3999,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      rating: 4.0,
      reviewCount: 1243,
      badge: {
        text: 'New Arrival',
        color: 'bg-amber-500'
      }
    },
    {
      id: 9,
      name: 'Prestige Iris 750W Mixer Grinder with 3 Stainless Steel Jars',
      price: 2799,
      originalPrice: 3999,
      image: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      rating: 4.5,
      reviewCount: 3789,
      badge: {
        text: 'Fast Selling',
        color: 'bg-secondary'
      }
    }
  ];

  // Use fallback data if still loading or error
  const displayProducts = (Array.isArray(products) && products.length > 0) ? products : fallbackProducts;

  return (
    <section className="py-6 px-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="p-2 rounded-md mr-3 bg-blue-50">
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center">
              Top Selling Products
              <div className="h-1 w-10 ml-3 rounded-full bg-blue-500"></div>
            </h2>
          </div>
        </div>
        <Link href="/shop?filter=top-selling">
          <div className="group flex items-center px-4 py-2 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:from-primary/90 hover:to-primary transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer">
            <span className="text-sm font-medium mr-2">View All</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </Link>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {displayProducts.map((product) => (
          <div key={product.id} className="h-full min-h-[400px]">
            <ProductCard
              id={product.id}
              name={product.name}
              price={product.price}
              originalPrice={product.originalPrice}
              image={product.image}
              rating={product.rating}
              reviewCount={product.reviewCount}
              badge={product.badge}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default TopSellingSection;
