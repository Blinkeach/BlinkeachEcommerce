import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import {
  Star,
  StarHalf,
  ShoppingCart,
  Check,
  Share2,
  Truck,
  RefreshCcw,
  Clock,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WishlistButton } from "@/components/ui/wishlist-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import ProductRecommendations from "@/components/recommendations/ProductRecommendations";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import ShareModal from "./ShareModal";
import ProductReviews from "./ProductReviews";
import ProductVariantSelector from "./ProductVariantSelector";
import Product3DPreview from "./Product3DPreview";

interface ProductDetailsProps {
  productId: number;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ productId }) => {
  const [quantity, setQuantity] = useState(1);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const { t } = useTranslation();

  const {
    data: product,
    isLoading,
    error,
  } = useQuery<any>({
    queryKey: [`/api/products/${productId}`],
  });

  // Add this product to recently viewed when the component mounts or productId changes
  useEffect(() => {
    if (productId && !isLoading && product) {
      addToRecentlyViewed(Number(productId));
    }
  }, [productId, product, isLoading]);

  // Initialize images and variants when product loads
  useEffect(() => {
    if (product) {
      setCurrentImages(product?.images || []);
      if (product?.colors && product.colors.length > 0) {
        setSelectedColor(product.colors[0]?.name || '');
        setCurrentImages(product.colors[0]?.images || product?.images || []);
      }
      if (product?.sizes && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0]?.name || '');
      }
    }
  }, [product]);

  // Update images when color changes
  useEffect(() => {
    if (product?.colors && selectedColor) {
      const colorData = product.colors.find((c: any) => c.name === selectedColor);
      if (colorData?.images && colorData.images.length > 0) {
        setCurrentImages(colorData.images);
        setSelectedImage(0);
      } else {
        setCurrentImages(product?.images || []);
        setSelectedImage(0);
      }
    }
  }, [selectedColor, product]);

  const fallbackProduct = {
    id: Number(productId),
    name: "OnePlus Nord CE 3 Lite 5G (8GB RAM, 128GB Storage)",
    description: "Experience lightning-fast 5G connectivity with the OnePlus Nord CE 3 Lite.",
    price: 16999,
    originalPrice: 24999,
    discount: 32,
    images: [
      "https://images.unsplash.com/photo-1585060544812-6b45742d762f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
    ],
    rating: 4.5,
    reviewCount: 2345,
    inStock: true,
    stock: 10,
    category: "Smartphones",
    highlights: ["6.7-inch 120Hz display", "64MP main camera"],
    specifications: {
      Display: "6.7-inch FHD+ LCD with 120Hz refresh rate",
      Processor: "Qualcomm Snapdragon 695",
    },
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="w-full h-96 bg-gray-200 animate-pulse rounded-lg"></div>
          </div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-6 bg-gray-200 animate-pulse rounded w-3/4"></div>
            <div className="h-12 bg-gray-200 animate-pulse rounded"></div>
            <div className="h-20 bg-gray-200 animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state with fallback content
  if (error && !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-8">The product you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  const displayProduct = product || fallbackProduct;
  const productWithStock = {
    ...displayProduct,
    inStock: displayProduct?.stock > 0 || displayProduct?.inStock,
  };

  const renderStars = () => {
    const rating = productWithStock.rating || 0;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-star-${i}`} className="h-3.5 w-3.5 fill-green-500 text-green-500" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="h-3.5 w-3.5 fill-green-500 text-green-500" />);
    }

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-star-${i}`} className="h-3.5 w-3.5 text-green-500" />);
    }

    return stars;
  };

  const handleAddToCart = async () => {
    if (!productWithStock.inStock) {
      toast({
        title: "Out of Stock",
        description: "This product is currently out of stock.",
        variant: "destructive",
      });
      return;
    }

    // Check if variants are required and selected
    const hasColors = product?.colors && product.colors.length > 0;
    const hasSizes = product?.sizes && product.sizes.length > 0;
    
    if (hasColors && !selectedColor) {
      toast({
        title: "Select Color",
        description: "Please select a color before adding to cart.",
        variant: "destructive",
      });
      return;
    }
    
    if (hasSizes && !selectedSize) {
      toast({
        title: "Select Size",
        description: "Please select a size before adding to cart.",
        variant: "destructive",
      });
      return;
    }

    await addToCart(
      productWithStock.id,
      quantity,
      productWithStock.name,
      productWithStock.price,
      currentImages[0] || productWithStock.images[0] || "",
      selectedColor || undefined,
      selectedSize || undefined
    );
  };

  const handleBuyNow = () => {
    if (!productWithStock.inStock) {
      toast({
        title: "Out of Stock",
        description: "This product is currently out of stock.",
        variant: "destructive",
      });
      return;
    }

    // Check if variants are required and selected
    const hasColors = product?.colors && product.colors.length > 0;
    const hasSizes = product?.sizes && product.sizes.length > 0;
    
    if (hasColors && !selectedColor) {
      toast({
        title: "Select Color",
        description: "Please select a color before buying.",
        variant: "destructive",
      });
      return;
    }
    
    if (hasSizes && !selectedSize) {
      toast({
        title: "Select Size", 
        description: "Please select a size before buying.",
        variant: "destructive",
      });
      return;
    }

    // Create buy now item data structure
    const buyNowItemData = {
      id: Date.now(), // Temporary ID for buy now
      productId: productWithStock.id,
      quantity,
      selectedColor: selectedColor || undefined,
      selectedSize: selectedSize || undefined,
      product: {
        id: productWithStock.id,
        name: productWithStock.name,
        price: productWithStock.price,
        discountedPrice: productWithStock.discountedPrice,
        originalPrice: productWithStock.originalPrice,
        image: currentImages[0] || productWithStock.images[0] || "",
        stock: productWithStock.stock
      }
    };

    // Store in session storage for checkout page
    sessionStorage.setItem('buyNowItem', JSON.stringify(buyNowItemData));

    // Navigate to checkout with buy now flag
    navigate("/checkout?buyNow=true");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          {(() => {
            const selectedColorData = product?.colors?.find((c: any) => c.name === selectedColor);
            const has3DModel = selectedColorData?.model3d || product?.model3d;
            const displayImages = currentImages.length > 0 ? currentImages : (productWithStock?.images || []);
            
            if (has3DModel) {
              return (
                <Product3DPreview
                  images={displayImages}
                  productName={productWithStock.name}
                  selectedColor={selectedColor}
                  className="h-96"
                  model3d={selectedColorData?.model3d || product?.model3d}
                />
              );
            }
            
            if (!displayImages || displayImages.length === 0) {
              return (
                <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">📦</div>
                    <div className="text-sm">No image available</div>
                  </div>
                </div>
              );
            }
            
            return (
              <div className="w-full bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="relative w-full h-96 bg-gray-50">
                  <img
                    src={displayImages[selectedImage] || displayImages[0]}
                    alt={productWithStock.name}
                    className="w-full h-full object-contain p-4"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  
                  {displayImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImage(selectedImage > 0 ? selectedImage - 1 : displayImages.length - 1)}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all z-10"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setSelectedImage(selectedImage < displayImages.length - 1 ? selectedImage + 1 : 0)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all z-10"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                  
                  {displayImages.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      {selectedImage + 1} / {displayImages.length}
                    </div>
                  )}
                </div>
                
                {displayImages.length > 1 && (
                  <div className="p-4 bg-gray-50">
                    <div className="flex gap-2 overflow-x-auto">
                      {displayImages.map((image: any, index: any) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                            selectedImage === index ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${productWithStock.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-2xl font-semibold mb-2 text-neutral-800">
            {productWithStock.name}
          </h1>

          <div className="flex items-center mb-4">
            <div className="flex">{renderStars()}</div>
            <span className="text-sm text-neutral-500 ml-2">
              ({productWithStock.reviewCount || "0"} reviews)
            </span>
            <span className="mx-2 text-neutral-300">|</span>
            {productWithStock.inStock ? (
              <span className="text-green-600 flex items-center text-sm">
                <Check className="h-4 w-4 mr-1" /> In Stock
              </span>
            ) : (
              <span className="text-red-500 text-sm">Out of Stock</span>
            )}
          </div>

          <div className="mb-6">
            <div className="flex items-center mb-1">
              <span className="text-2xl font-bold text-neutral-800">
                ₹{(productWithStock.price / 100).toLocaleString("en-IN")}
              </span>
              {productWithStock.originalPrice && productWithStock.originalPrice > productWithStock.price && (
                <>
                  <span className="text-lg text-neutral-500 line-through ml-2">
                    ₹{(productWithStock.originalPrice / 100).toLocaleString("en-IN")}
                  </span>
                  <span className="text-green-600 text-sm ml-2 font-medium">
                    {Math.round((productWithStock.originalPrice - productWithStock.price) / productWithStock.originalPrice * 100)}% off
                  </span>
                </>
              )}
            </div>
            <p className="text-sm text-neutral-500">Inclusive of all taxes</p>
          </div>

          <div className="mb-6">
            <p className="text-neutral-700 leading-relaxed">
              {productWithStock.description}
            </p>
          </div>

          {productWithStock.highlights && productWithStock.highlights.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Key Features:</h3>
              <ul className="space-y-1">
                {productWithStock.highlights.map((highlight: any, index: any) => (
                  <li key={index} className="flex items-start text-sm text-neutral-700">
                    <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Color and Size Variants */}
          {((product?.colors && product.colors.length > 0) || (product?.sizes && product.sizes.length > 0)) && (
            <div className="mb-6 space-y-4">
              {product?.colors && product.colors.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Color: {selectedColor}</h3>
                  <div className="flex gap-2">
                    {product.colors.map((color: any, index: any) => (
                      <button
                        key={index}
                        onClick={() => setSelectedColor(color.name)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          selectedColor === color.name ? 'border-gray-800 ring-2 ring-gray-300' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {product?.sizes && product.sizes.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Size: {selectedSize}</h3>
                  <div className="flex gap-2">
                    {product.sizes.map((size: any, index: any) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSize(size.name)}
                        className={`px-4 py-2 border rounded ${
                          selectedSize === size.name ? 'border-gray-800 bg-gray-100' : 'border-gray-300'
                        }`}
                      >
                        {size.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm font-medium mb-2">{t("product.category")}: {productWithStock.category}</p>
          </div>

          {/* Quantity and Add to Cart */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border rounded">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 hover:bg-gray-50"
              >
                -
              </button>
              <span className="px-4 py-2 border-x">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 hover:bg-gray-50"
              >
                +
              </button>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={!productWithStock.inStock}
              className="flex-1"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {t("product.add_to_cart")}
            </Button>

            <Button
              onClick={handleBuyNow}
              disabled={!productWithStock.inStock}
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              {t("product.buy_now")}
            </Button>

            <Button
              onClick={() => setShareModalOpen(true)}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              <Share2 className="h-4 w-4" />
            </Button>

            <WishlistButton productId={productWithStock.id} />
          </div>

          {/* Delivery Info */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center text-sm text-neutral-600">
              <Truck className="h-4 w-4 mr-2" />
              {t("product.free_shipping")}
            </div>
            <div className="flex items-center text-sm text-neutral-600">
              <RefreshCcw className="h-4 w-4 mr-2" />
              {t("product.easy_returns")}
            </div>
            <div className="flex items-center text-sm text-neutral-600">
              <Clock className="h-4 w-4 mr-2" />
              {t("product.delivery_time")}
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-12">
        <Tabs defaultValue="specifications">
          <TabsList className="w-full bg-neutral-100 p-0 rounded-md">
            <TabsTrigger value="specifications" className="flex-1 py-3">
              {t("product.specifications")}
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1 py-3">
              {t("product.reviews")}
            </TabsTrigger>
            <TabsTrigger value="shipping" className="flex-1 py-3">
              {t("product.shipping_returns")}
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="specifications"
            className="bg-white p-6 rounded-md mt-4 border border-neutral-200"
          >
            <h3 className="font-medium text-lg mb-4">Technical Specifications</h3>
            <div className="space-y-2">
              {productWithStock.specifications && typeof productWithStock.specifications === 'object' ? (
                Object.entries(productWithStock.specifications).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 py-2 border-b border-neutral-100">
                    <div className="font-medium text-neutral-700">{key}</div>
                    <div className="col-span-2 text-neutral-600">{String(value)}</div>
                  </div>
                ))
              ) : (
                <p className="text-neutral-600">No specifications available.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <ProductReviews productId={productWithStock.id} />
          </TabsContent>

          <TabsContent
            value="shipping"
            className="bg-white p-6 rounded-md mt-4 border border-neutral-200"
          >
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <Truck className="h-4 w-4 mr-2" />
                  Shipping Information
                </h4>
                <ul className="text-sm text-neutral-600 space-y-1">
                  <li>• Free shipping on orders above ₹1</li>
                  <li>• Standard delivery: 3-7 business days</li>
                  <li>• Express delivery: 1-2 business days (additional charges apply)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Return Policy
                </h4>
                <ul className="text-sm text-neutral-600 space-y-1">
                  <li>• 7-day easy returns</li>
                  <li>• Products must be in original condition</li>
                  <li>• Free return pickup available</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Warranty
                </h4>
                <ul className="text-sm text-neutral-600 space-y-1">
                  <li>• 1-year manufacturer warranty</li>
                  <li>• Covers manufacturing defects</li>
                  <li>• Warranty registration required</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Product Recommendations */}
      <div className="mt-12">
        <ProductRecommendations
          productId={productWithStock.id}
          category={productWithStock.category}
        />
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        productName={productWithStock.name}
        productUrl={`${window.location.origin}/product/${productWithStock.id}`}
        productImage={currentImages[0] || productWithStock.images?.[0] || ""}
        productPrice={productWithStock.price}
        productDescription={productWithStock.description}
        productId={productWithStock.id}
      />
    </div>
  );
};

export default ProductDetails;