import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Check, Package, Palette, TrendingUp, Zap, Star, AlertTriangle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ColorVariant {
  name: string;
  value: string;
  images: string[];
  popularity?: number; // 1-10 scale
  trend?: 'rising' | 'stable' | 'falling';
}

interface SizeVariant {
  name: string;
  stock: number;
  popularity?: number; // 1-10 scale
  recommended?: boolean;
}

interface StyleRecommendation {
  type: 'popular' | 'trending' | 'lowStock' | 'perfect' | 'seasonal';
  title: string;
  description: string;
  colorName?: string;
  sizeName?: string;
  icon: React.ComponentType<any>;
}

interface ProductVariantSelectorProps {
  colors?: ColorVariant[];
  sizes?: SizeVariant[];
  selectedColor?: string;
  selectedSize?: string;
  onColorChange?: (color: string) => void;
  onSizeChange?: (size: string) => void;
  onImageChange?: (images: string[]) => void;
  className?: string;
  productCategory?: string;
}

export default function ProductVariantSelector({
  colors = [],
  sizes = [],
  selectedColor,
  selectedSize,
  onColorChange,
  onSizeChange,
  onImageChange,
  className = '',
  productCategory = 'general'
}: ProductVariantSelectorProps) {
  const [currentColor, setCurrentColor] = useState<string>(selectedColor || '');
  const [currentSize, setCurrentSize] = useState<string>(selectedSize || '');
  const [showRecommendations, setShowRecommendations] = useState(true);

  useEffect(() => {
    if (selectedColor) setCurrentColor(selectedColor);
  }, [selectedColor]);

  useEffect(() => {
    if (selectedSize) setCurrentSize(selectedSize);
  }, [selectedSize]);

  const handleColorSelect = (color: ColorVariant) => {
    setCurrentColor(color.name);
    onColorChange?.(color.name);
    if (color.images && color.images.length > 0) {
      onImageChange?.(color.images);
    }
  };

  const handleSizeSelect = (size: SizeVariant) => {
    setCurrentSize(size.name);
    onSizeChange?.(size.name);
  };

  const getSelectedColorData = () => {
    return colors.find(c => c.name === currentColor);
  };

  const getStockForSize = (sizeName: string) => {
    const size = sizes.find(s => s.name === sizeName);
    return size?.stock || 0;
  };

  // Smart recommendation engine
  const recommendations = useMemo((): StyleRecommendation[] => {
    const recs: StyleRecommendation[] = [];

    // Popular color recommendations
    const popularColors = colors
      .filter(c => (c.popularity || 0) >= 7)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    
    if (popularColors.length > 0 && !currentColor) {
      recs.push({
        type: 'popular',
        title: 'Most Popular Choice',
        description: `${popularColors[0].name} is loved by 85% of customers`,
        colorName: popularColors[0].name,
        icon: Star
      });
    }

    // Trending color recommendations
    const trendingColors = colors.filter(c => c.trend === 'rising');
    if (trendingColors.length > 0 && !currentColor) {
      recs.push({
        type: 'trending',
        title: 'Trending Now',
        description: `${trendingColors[0].name} is gaining popularity this season`,
        colorName: trendingColors[0].name,
        icon: TrendingUp
      });
    }

    // Low stock warnings
    const lowStockSizes = sizes.filter(s => s.stock > 0 && s.stock <= 3);
    if (lowStockSizes.length > 0) {
      recs.push({
        type: 'lowStock',
        title: 'Limited Stock Alert',
        description: `Only ${lowStockSizes[0].stock} units left in ${lowStockSizes[0].name}`,
        sizeName: lowStockSizes[0].name,
        icon: AlertTriangle
      });
    }

    // Perfect match recommendations
    if (currentColor && currentSize) {
      const colorData = colors.find(c => c.name === currentColor);
      const sizeData = sizes.find(s => s.name === currentSize);
      if (colorData && sizeData && sizeData.stock > 5) {
        recs.push({
          type: 'perfect',
          title: 'Perfect Match!',
          description: `Great choice! This combination is in high demand`,
          icon: Sparkles
        });
      }
    }

    // Size recommendations
    const recommendedSizes = sizes.filter(s => s.recommended && s.stock > 0);
    if (recommendedSizes.length > 0 && !currentSize) {
      recs.push({
        type: 'perfect',
        title: 'Recommended Size',
        description: `Size ${recommendedSizes[0].name} fits most customers perfectly`,
        sizeName: recommendedSizes[0].name,
        icon: Zap
      });
    }

    return recs.slice(0, 2); // Show max 2 recommendations
  }, [colors, sizes, currentColor, currentSize]);

  // Get real-time inventory status
  const inventoryStatus = useMemo(() => {
    if (!currentColor && !currentSize) return null;
    
    const selectedColorData = colors.find(c => c.name === currentColor);
    const selectedSizeData = sizes.find(s => s.name === currentSize);
    
    if (selectedSizeData) {
      const stock = selectedSizeData.stock;
      if (stock === 0) return { status: 'outOfStock', message: 'Out of stock' };
      if (stock <= 3) return { status: 'lowStock', message: `Only ${stock} left` };
      if (stock <= 10) return { status: 'moderate', message: `${stock} in stock` };
      return { status: 'inStock', message: 'In stock' };
    }
    
    return null;
  }, [currentColor, currentSize, colors, sizes]);

  if (colors.length === 0 && sizes.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Color Selector */}
      {colors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Palette className="h-4 w-4 text-gray-600" />
            <h3 className="font-medium text-gray-900">Color</h3>
            {currentColor && (
              <Badge variant="secondary" className="text-xs">
                {currentColor}
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            {colors.map((color, index) => {
              const isPopular = (color.popularity || 0) >= 7;
              const isTrending = color.trend === 'rising';
              const isSelected = currentColor === color.name;
              
              return (
                <motion.div
                  key={color.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  {/* Popularity/Trending Badges */}
                  {isPopular && (
                    <Badge 
                      variant="default" 
                      className="absolute -top-2 -left-2 text-xs px-1.5 py-0.5 bg-yellow-500 text-white z-10"
                    >
                      Popular
                    </Badge>
                  )}
                  {isTrending && !isPopular && (
                    <Badge 
                      variant="default" 
                      className="absolute -top-2 -left-2 text-xs px-1.5 py-0.5 bg-green-500 text-white z-10"
                    >
                      Trending
                    </Badge>
                  )}
                  
                  <Button
                    variant="outline"
                    className={`relative w-16 h-16 p-1 rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => handleColorSelect(color)}
                  >
                    <div
                      className="w-full h-full rounded-md shadow-inner"
                      style={{ backgroundColor: color.value }}
                    />
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 shadow-md"
                      >
                        <Check className="h-3 w-3" />
                      </motion.div>
                    )}
                  </Button>
                  
                  {/* Color name tooltip */}
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
                    {color.name}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Size Selector */}
      {sizes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-gray-600" />
            <h3 className="font-medium text-gray-900">Size</h3>
            {currentSize && (
              <Badge variant="secondary" className="text-xs">
                {currentSize}
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3">
            {sizes.map((size, index) => {
              const stock = getStockForSize(size.name);
              const isOutOfStock = stock === 0;
              const isSelected = currentSize === size.name;
              const isLowStock = stock > 0 && stock <= 3;
              const isRecommended = size.recommended;
              
              return (
                <motion.div
                  key={size.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={!isOutOfStock ? { scale: 1.05 } : {}}
                  whileTap={!isOutOfStock ? { scale: 0.95 } : {}}
                  className="relative"
                >
                  {/* Recommendation badge */}
                  {isRecommended && !isOutOfStock && (
                    <Badge 
                      variant="default" 
                      className="absolute -top-2 -left-2 text-xs px-1.5 py-0.5 bg-blue-500 text-white z-10"
                    >
                      Recommended
                    </Badge>
                  )}
                  
                  <Button
                    variant="outline"
                    disabled={isOutOfStock}
                    className={`relative min-w-16 h-12 px-4 transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg'
                        : isOutOfStock
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : isLowStock
                        ? 'border-orange-300 bg-orange-50 text-orange-700 hover:border-orange-400'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => !isOutOfStock && handleSizeSelect(size)}
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-medium">{size.name}</span>
                      {isLowStock && !isSelected && (
                        <span className="text-xs text-orange-600">Only {stock} left</span>
                      )}
                    </div>
                    
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 shadow-md"
                      >
                        <Check className="h-3 w-3" />
                      </motion.div>
                    )}
                    
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-gray-200/50 rounded-md flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-500">Out of Stock</span>
                      </div>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>
          
          {/* Stock Information */}
          {currentSize && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <Card className="bg-gray-50 border-0">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Available stock:</span>
                    <Badge variant={getStockForSize(currentSize) > 5 ? 'default' : 'destructive'}>
                      {getStockForSize(currentSize)} units
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Real-time Inventory Status */}
      <AnimatePresence>
        {inventoryStatus && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`border rounded-lg p-4 ${
              inventoryStatus.status === 'outOfStock'
                ? 'bg-red-50 border-red-200'
                : inventoryStatus.status === 'lowStock'
                ? 'bg-orange-50 border-orange-200'
                : inventoryStatus.status === 'moderate'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-green-50 border-green-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className={`h-4 w-4 ${
                inventoryStatus.status === 'outOfStock'
                  ? 'text-red-600'
                  : inventoryStatus.status === 'lowStock'
                  ? 'text-orange-600'
                  : inventoryStatus.status === 'moderate'
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`} />
              <span className={`font-medium ${
                inventoryStatus.status === 'outOfStock'
                  ? 'text-red-900'
                  : inventoryStatus.status === 'lowStock'
                  ? 'text-orange-900'
                  : inventoryStatus.status === 'moderate'
                  ? 'text-yellow-900'
                  : 'text-green-900'
              }`}>
                {inventoryStatus.message}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Recommendations */}
      <AnimatePresence>
        {showRecommendations && recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <h4 className="font-medium text-gray-900">Smart Recommendations</h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRecommendations(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Dismiss
              </Button>
            </div>
            
            <div className="space-y-2">
              {recommendations.map((rec, index) => {
                const IconComponent = rec.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        rec.type === 'popular' ? 'bg-yellow-50 border-yellow-200' :
                        rec.type === 'trending' ? 'bg-green-50 border-green-200' :
                        rec.type === 'lowStock' ? 'bg-orange-50 border-orange-200' :
                        rec.type === 'perfect' ? 'bg-blue-50 border-blue-200' :
                        'bg-purple-50 border-purple-200'
                      }`}
                      onClick={() => {
                        if (rec.colorName && !currentColor) {
                          const color = colors.find(c => c.name === rec.colorName);
                          if (color) handleColorSelect(color);
                        }
                        if (rec.sizeName && !currentSize) {
                          const size = sizes.find(s => s.name === rec.sizeName);
                          if (size) handleSizeSelect(size);
                        }
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${
                            rec.type === 'popular' ? 'bg-yellow-100' :
                            rec.type === 'trending' ? 'bg-green-100' :
                            rec.type === 'lowStock' ? 'bg-orange-100' :
                            rec.type === 'perfect' ? 'bg-blue-100' :
                            'bg-purple-100'
                          }`}>
                            <IconComponent className={`h-4 w-4 ${
                              rec.type === 'popular' ? 'text-yellow-600' :
                              rec.type === 'trending' ? 'text-green-600' :
                              rec.type === 'lowStock' ? 'text-orange-600' :
                              rec.type === 'perfect' ? 'text-blue-600' :
                              'text-purple-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 mb-1">{rec.title}</h5>
                            <p className="text-sm text-gray-600">{rec.description}</p>
                            {(rec.colorName || rec.sizeName) && (
                              <div className="flex gap-2 mt-2">
                                {rec.colorName && (
                                  <Badge variant="outline" className="text-xs">
                                    {rec.colorName}
                                  </Badge>
                                )}
                                {rec.sizeName && (
                                  <Badge variant="outline" className="text-xs">
                                    Size {rec.sizeName}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Variant Summary */}
      <AnimatePresence>
        {(currentColor || currentSize) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-blue-900">Your Selection</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentColor && (
                <Badge variant="outline" className="bg-white border-blue-200 text-blue-700">
                  Color: {currentColor}
                </Badge>
              )}
              {currentSize && (
                <Badge variant="outline" className="bg-white border-blue-200 text-blue-700">
                  Size: {currentSize}
                </Badge>
              )}
            </div>
            {currentColor && currentSize && inventoryStatus?.status === 'inStock' && (
              <div className="mt-2 text-sm text-green-700 font-medium">
                ✓ Perfect! This combination is available and ready to ship.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}