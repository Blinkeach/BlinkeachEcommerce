import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  product: {
    id: number;
    name: string;
    price: number;
    discountedPrice?: number;
    originalPrice?: number;
    image: string;
    stock: number;
    hasVariants?: boolean;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (productId: number, quantity: number, name: string, price: number, image: string, selectedColor?: string, selectedSize?: string) => Promise<void>;
  removeFromCart: (itemId: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  updateCartItem: (itemId: number, updates: { selectedColor?: string; selectedSize?: string }) => Promise<void>;
  clearCart: () => Promise<void>;
  isLoading: boolean;
  totalPrice: number;
  totalItems: number;
  fetchCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const toast = useToast().toast;
  
  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          // If not authenticated, try to load cart from localStorage
          const savedCart = localStorage.getItem('cart');
          if (savedCart) {
            try {
              setCartItems(JSON.parse(savedCart));
            } catch (err) {
              console.error('Error parsing cart from localStorage:', err);
              localStorage.removeItem('cart');
            }
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      }
    };
    
    checkAuth();
  }, []);
  
  // Fetch cart from server if authenticated
  const fetchCart = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        setCartItems(data);
      } else if (response.status === 401) {
        // Not authenticated, revert to local storage
        setIsAuthenticated(false);
      } else {
        console.error('Error fetching cart:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch cart when authenticated state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated]);
  
  // Save cart to localStorage when not authenticated
  useEffect(() => {
    if (!isAuthenticated && cartItems.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated]);
  
  // Add to cart function
  const addToCart = async (
    productId: number, 
    quantity: number, 
    name: string, 
    price: number, 
    image: string,
    selectedColor?: string,
    selectedSize?: string
  ) => {
    setIsLoading(true);
    
    try {
      if (isAuthenticated) {
        // Server-side cart management
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId,
            quantity,
            selectedColor,
            selectedSize,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          toast({
            title: 'Error adding to cart',
            description: errorData.message || 'Could not add item to cart',
            variant: 'destructive',
          });
          return;
        }
        
        // Fetch updated cart
        await fetchCart();
        
        toast({
          title: 'Added to cart',
          description: `${name} has been added to your cart.`,
        });
      } else {
        // Client-side cart management
        setCartItems(prevItems => {
          const existingItemIndex = prevItems.findIndex(i => i.product.id === productId);
          
          if (existingItemIndex > -1) {
            const updatedItems = [...prevItems];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + quantity
            };
            return updatedItems;
          } else {
            // Create new cart item with the appropriate structure
            const newItem: CartItem = {
              id: Date.now(), // Client-side temporary ID
              productId,
              quantity,
              selectedColor,
              selectedSize,
              product: {
                id: productId,
                name,
                price,
                image,
                stock: 999, // Assume high stock for client-side cart
              }
            };
            return [...prevItems, newItem];
          }
        });
        
        toast({
          title: 'Added to cart',
          description: `${name} has been added to your cart.`,
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: 'Error',
        description: 'Could not add item to cart. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Remove from cart function
  const removeFromCart = async (itemId: number) => {
    setIsLoading(true);
    
    try {
      if (isAuthenticated) {
        // Server-side cart management
        const response = await fetch(`/api/cart/${itemId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to remove item from cart');
        }
        
        // Fetch updated cart
        await fetchCart();
      } else {
        // Client-side cart management
        setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: 'Error',
        description: 'Could not remove item from cart. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update quantity function
  const updateQuantity = async (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isAuthenticated) {
        // Server-side cart management
        const response = await fetch(`/api/cart/${itemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quantity }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          toast({
            title: 'Error updating cart',
            description: errorData.message || 'Could not update item quantity',
            variant: 'destructive',
          });
          return;
        }
        
        // Fetch updated cart
        await fetchCart();
      } else {
        // Client-side cart management
        setCartItems(prevItems => 
          prevItems.map(item => 
            item.id === itemId 
              ? { ...item, quantity } 
              : item
          )
        );
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: 'Error',
        description: 'Could not update item quantity. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update cart item variants
  const updateCartItem = async (itemId: number, updates: { selectedColor?: string; selectedSize?: string }) => {
    setIsLoading(true);
    
    try {
      if (isAuthenticated) {
        // Server-side cart management
        const response = await fetch(`/api/cart/${itemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          toast({
            title: 'Error updating cart',
            description: errorData.message || 'Could not update item variants',
            variant: 'destructive',
          });
          return;
        }
        
        // Fetch updated cart
        await fetchCart();
        
        toast({
          title: 'Cart updated',
          description: 'Variant selection updated successfully.',
        });
      } else {
        // Client-side cart management
        setCartItems(prevItems => 
          prevItems.map(item => 
            item.id === itemId 
              ? { ...item, ...updates } 
              : item
          )
        );
        
        toast({
          title: 'Cart updated',
          description: 'Variant selection updated successfully.',
        });
      }
    } catch (error) {
      console.error('Error updating cart item:', error);
      toast({
        title: 'Error',
        description: 'Could not update item variants. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear cart function
  const clearCart = async () => {
    setIsLoading(true);
    
    try {
      if (isAuthenticated) {
        // Server-side cart management
        const response = await fetch('/api/cart', {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to clear cart');
        }
        
        setCartItems([]);
      } else {
        // Client-side cart management
        setCartItems([]);
        localStorage.removeItem('cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: 'Error',
        description: 'Could not clear your cart. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate total price
  const totalPrice = cartItems.reduce((sum, item) => {
    const itemPrice = item.product?.discountedPrice || item.product?.price || 0;
    return sum + (itemPrice * item.quantity);
  }, 0);
  
  // Calculate total items
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateCartItem,
    clearCart,
    isLoading,
    totalPrice,
    totalItems,
    fetchCart
  };

  return React.createElement(
    CartContext.Provider,
    { value },
    children
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};