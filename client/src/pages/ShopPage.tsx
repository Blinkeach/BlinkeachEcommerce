import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import ProductGrid from '@/components/shop/ProductGrid';
import ProductFilters from '@/components/shop/ProductFilters';
import { useMobile } from '@/hooks/use-mobile';

const ShopPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/shop/:category?');
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const isMobile = useMobile();
  
  // State for filters
  const [filters, setFilters] = useState({
    category: params?.category || searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : 0,
    maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : 100000,
    sortBy: searchParams.get('sortBy') || '',
    availability: searchParams.get('availability')?.split(',') || []
  });
  
  // State for mobile filters visibility
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch products with filters
  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/products', filters],
    queryFn: async () => {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters.category) queryParams.set('category', filters.category);
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.minPrice > 0) queryParams.set('minPrice', filters.minPrice.toString());
      if (filters.maxPrice < 100000) queryParams.set('maxPrice', filters.maxPrice.toString());
      if (filters.sortBy) queryParams.set('sortBy', filters.sortBy);
      
      const url = `/api/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      return response.json();
    }
  });

  // Handle filter changes
  const handleFilterChange = (newFilters: Record<string, any>) => {
    // Create merged filters object
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Update URL with filters
    const urlParams = new URLSearchParams();
    
    if (updatedFilters.category) urlParams.set('category', updatedFilters.category);
    if (updatedFilters.search) urlParams.set('search', updatedFilters.search);
    if (updatedFilters.minPrice !== 0) urlParams.set('minPrice', updatedFilters.minPrice.toString());
    if (updatedFilters.maxPrice !== 100000) urlParams.set('maxPrice', updatedFilters.maxPrice.toString());
    if (updatedFilters.sortBy) urlParams.set('sortBy', updatedFilters.sortBy);
    if (updatedFilters.availability?.length) urlParams.set('availability', updatedFilters.availability.join(','));
    
    const queryString = urlParams.toString();
    setLocation(`/shop${queryString ? `?${queryString}` : ''}`);
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange(filters);
  };

  // Use sample products if API data is not available yet
  const sampleProducts = Array(24).fill(0).map((_, index) => ({
    id: index + 1,
    name: `Sample Product ${index + 1}`,
    price: Math.floor(Math.random() * 1000000) + 100000, // Between ₹1,000 and ₹10,000
    originalPrice: Math.floor(Math.random() * 1500000) + 100000, // Between ₹1,000 and ₹15,000
    images: ['https://via.placeholder.com/150'],
    image: 'https://via.placeholder.com/150',
    rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // Between 3 and 5
    reviewCount: Math.floor(Math.random() * 1000),
    stock: Math.floor(Math.random() * 100)
  }));

  const displayProducts = products || sampleProducts;
  
  // Available categories
  const categories = [
    'Home',
    'Home & Office',
    'Arts & Craft',
    'Electronics',
    'Fashion',
    'Appliances',
    'Toy'
  ];

  const pageTitle = filters.category 
    ? `${filters.category.charAt(0).toUpperCase() + filters.category.slice(1)} - Blinkeach`
    : filters.search
    ? `Search results for "${filters.search}" - Blinkeach`
    : 'Shop All Products - Blinkeach';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={`Browse and shop for ${filters.category || 'all products'} on Blinkeach. Great deals, fast delivery, easy returns.`} />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col mb-6">
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">
            {filters.category 
              ? `${filters.category.charAt(0).toUpperCase() + filters.category.slice(1)}`
              : filters.search
              ? `Search results for "${filters.search}"`
              : 'All Products'}
          </h1>
          <p className="text-neutral-600">
            Discover our wide range of {filters.category || 'products'} at unbeatable prices.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters for desktop */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <ProductFilters 
              categories={categories}
              minPrice={0}
              maxPrice={100000}
              onFilterChange={handleFilterChange}
              currentFilters={filters}
            />
          </div>

          {/* Main content */}
          <div className="flex-1">
            <div className="flex flex-col gap-4 mb-6">
              {/* Search and filter bar */}
              <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm">
                <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Input
                      placeholder="Search products..."
                      value={filters.search}
                      onChange={handleSearchChange}
                      className="pr-10"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      variant="ghost" 
                      className="absolute right-0 top-0 h-full"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Button>
                  </div>
                </form>

                <div className="flex items-center gap-2">
                  {/* Mobile filter button */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="md:hidden flex items-center"
                    onClick={() => setShowMobileFilters(true)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                  
                  {/* Sort by dropdown for desktop */}
                  <div className="hidden md:flex items-center">
                    <span className="text-sm text-neutral-600 mr-2">Sort by:</span>
                    <select 
                      className="text-sm border rounded p-1.5"
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange({ ...filters, sortBy: e.target.value })}
                    >
                      <option value="">Relevance</option>
                      <option value="price-low-high">Price: Low to High</option>
                      <option value="price-high-low">Price: High to Low</option>
                      <option value="newest">Newest First</option>
                      <option value="rating">Highest Rated</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Active filters display */}
              {(filters.category || filters.minPrice > 0 || filters.maxPrice < 100000 || filters.availability.length > 0) && (
                <div className="flex flex-wrap gap-2 items-center bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-sm text-neutral-600">Active Filters:</span>
                  
                  {filters.category && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => handleFilterChange({ ...filters, category: '' })}
                    >
                      Category: {filters.category}
                      <X className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                  
                  {(filters.minPrice > 0 || filters.maxPrice < 100000) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => handleFilterChange({ ...filters, minPrice: 0, maxPrice: 100000 })}
                    >
                      Price: ₹{filters.minPrice.toLocaleString('en-IN')} - ₹{filters.maxPrice.toLocaleString('en-IN')}
                      <X className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                  
                  {filters.availability.map((item) => (
                    <Button 
                      key={item}
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => {
                        const newAvailability = filters.availability.filter(avail => avail !== item);
                        handleFilterChange({ ...filters, availability: newAvailability });
                      }}
                    >
                      {item === 'in-stock' ? 'In Stock' : 'Out of Stock'}
                      <X className="h-3 w-3 ml-1" />
                    </Button>
                  ))}
                  
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-7 text-xs text-secondary"
                    onClick={() => handleFilterChange({
                      category: '',
                      minPrice: 0,
                      maxPrice: 100000,
                      sortBy: '',
                      availability: []
                    })}
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>

            {/* Product Grid */}
            <ProductGrid
              products={displayProducts}
              isLoading={isLoading}
              gridCols={4}
            />
          </div>
        </div>
      </div>

      {/* Mobile Filters */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden flex">
          <div className="bg-white w-full max-w-xs ml-auto h-full p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <SlidersHorizontal className="mr-2 h-5 w-5" /> Filters
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowMobileFilters(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <Separator className="mb-4" />
            
            <div className="flex-1 overflow-y-auto">
              <ProductFilters 
                categories={categories}
                minPrice={0}
                maxPrice={100000}
                onFilterChange={handleFilterChange}
                currentFilters={filters}
                isMobile={true}
                onMobileClose={() => setShowMobileFilters(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShopPage;
