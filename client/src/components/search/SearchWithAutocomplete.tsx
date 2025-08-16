import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, Clock, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  isPopular?: boolean;
  searchScore?: number;
}

interface SearchWithAutocompleteProps {
  className?: string;
  placeholder?: string;
  onSearchSubmit?: (query: string) => void;
}

const SearchWithAutocomplete: React.FC<SearchWithAutocompleteProps> = ({
  className = '',
  placeholder,
  onSearchSubmit
}) => {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('blinkeach-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse recent searches');
      }
    }
  }, []);

  // Fetch search suggestions when user types
  const { data: rawSuggestions = [], isLoading } = useQuery({
    queryKey: ['/api/search/suggestions', searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: searchQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Advanced ranking algorithm for search results
  const suggestions = rawSuggestions.map((product: Product) => {
    const query = searchQuery.toLowerCase();
    const name = product.name.toLowerCase();
    const category = product.category.toLowerCase();
    
    let score = 0;
    
    // Exact name match gets highest score
    if (name === query) score += 100;
    // Name starts with query gets high score
    else if (name.startsWith(query)) score += 80;
    // Name contains query gets medium score
    else if (name.includes(query)) score += 60;
    // Category match gets lower score
    else if (category.includes(query)) score += 40;
    
    // Boost score for popular products (if available)
    if (product.rating && product.rating >= 4) score += 10;
    if (product.reviewCount && product.reviewCount > 50) score += 5;
    
    // Boost score for products with discount
    if (product.originalPrice && product.originalPrice > product.price) score += 8;
    
    // Boost score for in-stock products
    if (product.stock && product.stock > 0) score += 5;
    
    return { ...product, searchScore: score };
  }).sort((a: Product, b: Product) => (b.searchScore || 0) - (a.searchScore || 0));

  // Show suggestions when user types and there are results
  useEffect(() => {
    setShowSuggestions(searchQuery.length >= 2 && (suggestions.length > 0 || recentSearches.length > 0));
    setSelectedIndex(-1);
  }, [searchQuery, suggestions, recentSearches]);

  // Save search to recent searches
  const saveSearchHistory = (query: string) => {
    if (!query.trim()) return;
    
    const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('blinkeach-recent-searches', JSON.stringify(newRecent));
  };

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          const selectedProduct = suggestions[selectedIndex];
          setLocation(`/product/${selectedProduct.id}`);
        } else {
          handleSearchSubmit();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (searchQuery.trim()) {
      saveSearchHistory(searchQuery.trim());
      setShowSuggestions(false);
      if (onSearchSubmit) {
        onSearchSubmit(searchQuery.trim());
      } else {
        setLocation(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const handleSuggestionClick = (product: Product) => {
    saveSearchHistory(product.name);
    setSearchQuery('');
    setShowSuggestions(false);
    setLocation(`/product/${product.id}`);
  };

  const handleRecentSearchClick = (search: string) => {
    setSearchQuery(search);
    setShowSuggestions(false);
    if (onSearchSubmit) {
      onSearchSubmit(search);
    } else {
      setLocation(`/shop?search=${encodeURIComponent(search)}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={index} className="bg-yellow-200 text-gray-900">{part}</mark>
        : part
    );
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSearchSubmit} className="relative w-full">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder || t("common.search")}
          className="w-full border border-neutral-300 rounded-md py-2 px-4 pr-20"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchQuery.length >= 2 && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          autoComplete="off"
        />
        
        {/* Clear button */}
        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-12 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
            onClick={clearSearch}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        
        {/* Search button */}
        <Button
          type="submit"
          className="absolute right-0 top-0 h-full px-4 bg-secondary text-white rounded-r-md hover:bg-secondary/90"
        >
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {/* Search suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            <>
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {t('search.productSuggestions')}
                </span>
              </div>
              {suggestions.slice(0, 6).map((product: Product, index: number) => (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => handleSuggestionClick(product)}
                >
                  <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {highlightMatch(product.name, searchQuery)}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {product.category}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* View all results option */}
              <div
                className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-t border-gray-200 transition-colors ${
                  selectedIndex === suggestions.length ? 'bg-blue-50' : ''
                }`}
                onClick={handleSearchSubmit}
              >
                <Search className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="text-blue-600 font-medium">
                  View all results for "{searchQuery}"
                </span>
              </div>
            </>
          ) : recentSearches.length > 0 ? (
            <>
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {t('search.recentSearches')}
                </span>
              </div>
              {recentSearches.map((search, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleRecentSearchClick(search)}
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Search className="h-4 w-4 text-gray-500" />
                  </div>
                  <span className="text-gray-700">{search}</span>
                </div>
              ))}
            </>
          ) : (
            <div className="p-6 text-center">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <div className="text-gray-500 mb-1">No results found</div>
              <div className="text-sm text-gray-400">Try searching for different keywords</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchWithAutocomplete;