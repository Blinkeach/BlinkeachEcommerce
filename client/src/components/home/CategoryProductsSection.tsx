import React from 'react';
import { useQuery } from '@tanstack/react-query';
import ProductGrid from '@/components/shop/ProductGrid';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';

const CategoryProductsSection: React.FC = () => {
  // Fetch all products
  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products', { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      return response.json();
    }
  });

  return (
    <section className="py-8 px-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="p-2 rounded-md mr-3 bg-primary/10">
            <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              All Products
              <div className="h-1 w-10 ml-3 rounded-full bg-primary"></div>
            </h2>
          </div>
        </div>
        <Link href="/shop">
          <div className="group flex items-center px-4 py-2 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:from-primary/90 hover:to-primary transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer">
            <span className="text-sm font-medium mr-2">View All</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </Link>
      </div>
      
      <ProductGrid 
        products={products || []} 
        isLoading={isLoading}
        gridCols={4}
      />
    </section>
  );
};

export default CategoryProductsSection;