import React, { useState } from 'react';
import { Link } from 'wouter';
import { X, Plus, Minus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart, CartItem as CartItemType } from '@/lib/cart';
import { useQuery } from '@tanstack/react-query';

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart, isLoading, updateCartItem } = useCart();
  const [localLoading, setLocalLoading] = useState(false);
  
  // Fetch product variants if this is a variant product
  const { data: productData } = useQuery({
    queryKey: [`/api/products/${item.productId}`],
    enabled: Boolean(item.product?.hasVariants)
  });

  // Handle variant selection
  const handleVariantChange = async (type: 'color' | 'size', value: string) => {
    if (!updateCartItem) return;
    
    setLocalLoading(true);
    try {
      const updates = type === 'color' 
        ? { selectedColor: value }
        : { selectedSize: value };
      
      await updateCartItem(item.id, updates);
    } catch (error) {
      console.error('Failed to update variant:', error);
    } finally {
      setLocalLoading(false);
    }
  };
  
  const handleQuantityChange = async (newQuantity: number) => {
    setLocalLoading(true);
    try {
      await updateQuantity(item.id, newQuantity);
    } catch (error) {
      console.error("Error updating quantity:", error);
    } finally {
      setLocalLoading(false);
    }
  };
  
  const handleRemove = async () => {
    setLocalLoading(true);
    try {
      await removeFromCart(item.id);
    } catch (error) {
      console.error("Error removing item:", error);
    } finally {
      setLocalLoading(false);
    }
  };


  
  // Calculate item price
  const price = item.product?.discountedPrice || item.product?.price || 0;
  const totalPrice = price * item.quantity;
  
  const isItemLoading = isLoading || localLoading;

  return (
    <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-neutral-200 relative ${isItemLoading ? 'opacity-60' : ''}`}>
      {isItemLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      <div className="flex items-center mb-4 sm:mb-0">
        <Link href={`/product/${item.productId}`}>
          <div className="w-20 h-20 bg-white p-2 rounded border border-neutral-200 mr-4 flex-shrink-0 cursor-pointer hover:shadow-md transition-shadow">
            <img 
              src={item.product?.image || ''} 
              alt={item.product?.name || ''} 
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
        </Link>
        <div>
          <Link href={`/product/${item.productId}`}>
            <h3 className="text-base font-medium text-neutral-800 mb-1 line-clamp-2 cursor-pointer hover:text-secondary transition-colors">
              {item.product?.name || ''}
            </h3>
          </Link>
          {/* Show selected variants or indicate missing selection */}
          {item.product?.hasVariants && (
            <div className="flex flex-wrap gap-2 mb-2">
              {item.selectedColor ? (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                  Color: {item.selectedColor}
                </span>
              ) : (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium cursor-pointer hover:bg-red-200">
                  Select Color
                </span>
              )}
              {item.selectedSize ? (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                  Size: {item.selectedSize}
                </span>
              ) : (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium cursor-pointer hover:bg-red-200">
                  Select Size
                </span>
              )}
            </div>
          )}
          
          {/* Show available variant combinations for variant products */}
          {item.product?.hasVariants && productData && Array.isArray((productData as any).variants) && (
            <div className="mb-2">
              <div className="text-xs text-neutral-600 mb-1">Available Options:</div>
              <div className="space-y-2">
                {/* Colors */}
                <div>
                  <span className="text-xs font-medium text-neutral-700 mr-2">Colors:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(() => {
                      const uniqueColors = Array.from(
                        new Map((productData as any).variants.map((v: any) => [v.colorName, { name: v.colorName, value: v.colorValue }])).values()
                      );
                      return uniqueColors.map((color: any, index: number) => (
                        <div 
                          key={`color-${color.name}-${color.value}-${index}`}
                          className={`w-6 h-6 rounded-full border-2 shadow-sm cursor-pointer hover:scale-110 transition-transform ${
                            item.selectedColor === color.name 
                              ? 'border-primary ring-2 ring-primary ring-opacity-50' 
                              : 'border-neutral-300'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                          onClick={() => handleVariantChange('color', color.name)}
                        />
                      ));
                    })()}
                  </div>
                </div>
                {/* Sizes */}
                <div>
                  <span className="text-xs font-medium text-neutral-700 mr-2">Sizes:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(() => {
                      const uniqueSizes = Array.from(new Set((productData as any).variants.map((v: any) => v.sizeName)));
                      return uniqueSizes.map((size: any, index: number) => (
                        <span 
                          key={`size-${size}-${index}`}
                          className={`text-xs px-2 py-1 rounded border cursor-pointer transition-colors ${
                            item.selectedSize === size
                              ? 'bg-primary text-white border-primary'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200'
                          }`}
                          onClick={() => handleVariantChange('size', size)}
                        >
                          {size}
                        </span>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Show variants for non-variant products if they have any selected */}
          {!item.product?.hasVariants && (item.selectedColor || item.selectedSize) && (
            <div className="flex flex-wrap gap-2 mb-2">
              {item.selectedColor && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                  Color: {item.selectedColor}
                </span>
              )}
              {item.selectedSize && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                  Size: {item.selectedSize}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center text-sm">
            <span className="font-semibold text-neutral-800">₹{(price/100).toLocaleString('en-IN')}</span>
            {item.product?.originalPrice && item.product.originalPrice > price && (
              <span className="line-through text-neutral-500 ml-2">
                ₹{(item.product.originalPrice/100).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center border border-neutral-300 rounded-md">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-r-none"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1 || isItemLoading}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center">{item.quantity}</span>
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-l-none"
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={isItemLoading || Boolean(item.product?.stock && item.quantity >= item.product.stock)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="min-w-[100px] text-right">
          <span className="font-semibold text-neutral-800">
            ₹{(totalPrice/100).toLocaleString('en-IN')}
          </span>
        </div>
        
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          className="text-neutral-500 hover:text-accent"
          onClick={handleRemove}
          disabled={isItemLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CartItem;
