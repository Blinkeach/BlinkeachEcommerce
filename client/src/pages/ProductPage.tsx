import React, { useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import ProductDetails from '@/components/shop/ProductDetails';
import ProductCard from '@/components/shop/ProductCard';
import { Separator } from '@/components/ui/separator';

// Define product type to fix TypeScript errors
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  stock: number;
  images: string[];
  image?: string;
  rating?: number;
  reviewCount?: number;
}

const ProductPage: React.FC = () => {
  const [match, params] = useRoute('/product/:id');
  
  const productId = params?.id ? parseInt(params.id) : 0;
  
  const { data: product, isLoading: isProductLoading } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId
  });

  const { data: relatedProducts, isLoading: isRelatedLoading } = useQuery<Product[]>({
    queryKey: [`/api/products/${productId}/related`],
    enabled: !!productId
  });

  // Scroll to top when product changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [productId]);

  if (!match) {
    return <div>Product not found</div>;
  }

  // Fallback data for demo
  const fallbackRelatedProducts: Product[] = Array(5).fill(0).map((_, index) => ({
    id: 100 + index,
    name: `Related Product ${index + 1}`,
    description: 'Product description placeholder',
    price: Math.floor(Math.random() * 1000000) + 100000, // Between ₹1,000 and ₹10,000
    originalPrice: Math.floor(Math.random() * 1500000) + 100000, // Between ₹1,000 and ₹15,000
    category: 'Electronics',
    stock: 10,
    images: ['https://via.placeholder.com/150'],
    image: 'https://via.placeholder.com/150',
    rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // Between 3 and 5
    reviewCount: Math.floor(Math.random() * 1000)
  }));

  const displayRelatedProducts: Product[] = relatedProducts || fallbackRelatedProducts;

  const productName = product?.name || 'Loading Product...';
  const productDescription = product?.description || 'Product details loading...';

  return (
    <>
      <Helmet>
        <title>{productName} - Blinkeach</title>
        <meta name="description" content={productDescription.slice(0, 160)} />
      </Helmet>

      <div>
        {/* Product details section */}
        <ProductDetails productId={productId} />
        
        {/* Related Products */}
        <div className="max-w-7xl mx-auto px-4 py-10">
          <Separator className="mb-6" />
          
          <h2 className="text-xl font-semibold mb-6">You may also like</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {displayRelatedProducts.map((product) => {
              // Ensure we have all required properties
              const imageUrl = product.image || (product.images && product.images.length > 0 ? product.images[0] : '');
              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  image={imageUrl}
                  rating={product.rating ?? 0}
                  reviewCount={product.reviewCount ?? 0}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductPage;
