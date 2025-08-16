import React, { useState } from 'react';
import { useNavigate, useLocation } from 'wouter';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter } from 'lucide-react';

interface ProductFiltersProps {
  categories: string[];
  minPrice: number;
  maxPrice: number;
  onFilterChange: (filters: Record<string, any>) => void;
  isMobile?: boolean;
  onMobileClose?: () => void;
  currentFilters: Record<string, any>;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  minPrice,
  maxPrice,
  onFilterChange,
  isMobile = false,
  onMobileClose,
  currentFilters
}) => {
  const [priceRange, setPriceRange] = useState<[number, number]>([
    currentFilters.minPrice || minPrice,
    currentFilters.maxPrice || maxPrice
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>(currentFilters.category || '');
  const [sortBy, setSortBy] = useState<string>(currentFilters.sortBy || '');
  const [availability, setAvailability] = useState<string[]>(currentFilters.availability || []);

  const handlePriceChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handleAvailabilityChange = (value: string) => {
    setAvailability(
      availability.includes(value)
        ? availability.filter(item => item !== value)
        : [...availability, value]
    );
  };

  const handleApplyFilters = () => {
    onFilterChange({
      category: selectedCategory,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      sortBy,
      availability
    });

    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const handleResetFilters = () => {
    setPriceRange([minPrice, maxPrice]);
    setSelectedCategory('');
    setSortBy('');
    setAvailability([]);
    
    onFilterChange({
      category: '',
      minPrice,
      maxPrice,
      sortBy: '',
      availability: []
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${isMobile ? 'w-full h-full overflow-y-auto' : ''}`}>
      {isMobile && (
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h2 className="text-lg font-semibold flex items-center">
            <Filter className="mr-2 h-5 w-5" /> Filters
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onMobileClose}
          >
            Close
          </Button>
        </div>
      )}

      <Accordion type="multiple" defaultValue={["category", "price", "sort", "availability"]} className="space-y-4">
        <AccordionItem value="category">
          <AccordionTrigger className="text-base font-medium py-2">Categories</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 mt-2">
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`category-${category}`} 
                    checked={selectedCategory === category}
                    onCheckedChange={() => handleCategoryChange(category)}
                  />
                  <Label 
                    htmlFor={`category-${category}`}
                    className="text-sm cursor-pointer"
                  >
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price">
          <AccordionTrigger className="text-base font-medium py-2">Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 mt-2">
              <Slider
                min={minPrice}
                max={maxPrice}
                step={100}
                value={[priceRange[0], priceRange[1]]}
                onValueChange={handlePriceChange}
                className="mt-6"
              />
              
              <div className="flex items-center justify-between mt-2">
                <div className="w-full max-w-[45%]">
                  <Label htmlFor="min-price" className="text-xs text-neutral-500 mb-1 block">Min</Label>
                  <Input
                    id="min-price"
                    type="number"
                    min={minPrice}
                    max={priceRange[1]}
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="h-8 text-sm"
                  />
                </div>
                <span className="text-neutral-400 px-2">-</span>
                <div className="w-full max-w-[45%]">
                  <Label htmlFor="max-price" className="text-xs text-neutral-500 mb-1 block">Max</Label>
                  <Input
                    id="max-price"
                    type="number"
                    min={priceRange[0]}
                    max={maxPrice}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sort">
          <AccordionTrigger className="text-base font-medium py-2">Sort By</AccordionTrigger>
          <AccordionContent>
            <RadioGroup 
              value={sortBy} 
              onValueChange={handleSortChange}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="newest" id="newest" />
                <Label htmlFor="newest" className="text-sm cursor-pointer">Newest First</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="price-low-high" id="price-low-high" />
                <Label htmlFor="price-low-high" className="text-sm cursor-pointer">Price: Low to High</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="price-high-low" id="price-high-low" />
                <Label htmlFor="price-high-low" className="text-sm cursor-pointer">Price: High to Low</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rating" id="rating" />
                <Label htmlFor="rating" className="text-sm cursor-pointer">Rating</Label>
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="availability">
          <AccordionTrigger className="text-base font-medium py-2">Availability</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="in-stock" 
                  checked={availability.includes('in-stock')}
                  onCheckedChange={() => handleAvailabilityChange('in-stock')}
                />
                <Label htmlFor="in-stock" className="text-sm cursor-pointer">In Stock</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="out-of-stock" 
                  checked={availability.includes('out-of-stock')}
                  onCheckedChange={() => handleAvailabilityChange('out-of-stock')}
                />
                <Label htmlFor="out-of-stock" className="text-sm cursor-pointer">Out of Stock</Label>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex flex-col space-y-2 mt-6">
        <Button 
          onClick={handleApplyFilters}
          className="w-full bg-secondary hover:bg-secondary-dark text-white"
        >
          Apply Filters
        </Button>
        <Button 
          variant="outline" 
          onClick={handleResetFilters}
          className="w-full"
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
};

export default ProductFilters;
