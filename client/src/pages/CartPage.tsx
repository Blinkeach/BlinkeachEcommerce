import React from 'react';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';
import { useCart } from '@/lib/cart';

const CartPage: React.FC = () => {
  const { cartItems, clearCart } = useCart();

  return (
    <>
      <Helmet>
        <title>Your Shopping Cart - Blinkeach</title>
        <meta name="description" content="Review the items in your shopping cart and proceed to checkout." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-800">Your Shopping Cart</h1>
          <Link href="/shop">
            <a className="text-secondary hover:underline flex items-center text-sm mt-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Continue Shopping
            </a>
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Cart Items */}
          <div className="flex-1">
            {cartItems.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-8 w-8 text-neutral-400" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
                <p className="text-neutral-600 mb-6">
                  Looks like you haven't added any products to your cart yet.
                </p>
                <Link href="/shop">
                  <Button className="bg-secondary hover:bg-secondary-dark text-white">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <h2 className="font-semibold">
                    Cart Items ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})
                  </h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  >
                    Clear Cart
                  </Button>
                </div>
                
                <div className="divide-y">
                  {cartItems.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          {cartItems.length > 0 && (
            <div className="lg:w-80">
              <CartSummary />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartPage;
