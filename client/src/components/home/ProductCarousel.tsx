import React, { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import ProductCard from "@/components/shop/ProductCard";
import { useQuery } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Circle,
  Tag,
  Award,
} from "lucide-react";

// Define product type
interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  discount?: number;
  badge?: {
    text: string;
    color: string;
  };
  stock?: number;
}

// Marquee Carousel Component for a single carousel
interface MarqueeCarouselProps {
  title: string;
  icon: React.ReactNode;
  products: Product[];
  isLoading: boolean;
  filterType: string;
  direction: "left" | "right";
  speed: number;
  accentColor: string;
}

const MarqueeCarousel: React.FC<MarqueeCarouselProps> = ({
  title,
  icon,
  products,
  isLoading,
  filterType,
  direction,
  speed,
  accentColor,
}) => {
  const autoplayOptions = {
    delay: 0, // Continuous scrolling
    stopOnInteraction: true,
    stopOnMouseEnter: true,
    playOnInit: true,
    rootNode: (emblaRoot: HTMLElement) => emblaRoot.parentElement,
  };

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      dragFree: true,
      containScroll: "trimSnaps",
      direction: direction === "left" ? "ltr" : "rtl",
    },
    [Autoplay(autoplayOptions)],
  );

  useEffect(() => {
    if (!emblaApi || isLoading) return;

    const intervalId = setInterval(() => {
      emblaApi.scrollNext();
    }, speed);

    return () => clearInterval(intervalId);
  }, [emblaApi, isLoading, speed]);

  // Carousel navigation functions
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div
            className={`p-2 rounded-md mr-3`}
            style={{ backgroundColor: `${accentColor}20` }}
          >
            {icon}
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold flex items-center">
              {title}
              <div
                className={`h-1 w-10 ml-3 rounded-full`}
                style={{ backgroundColor: accentColor }}
              ></div>
            </h2>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link href={`/shop?filter=${filterType}`}>
            <span className="text-secondary hover:underline text-sm cursor-pointer font-medium">
              View All
            </span>
          </Link>
          <div className="flex bg-gray-100 p-1 rounded-lg shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-white hover:shadow-sm"
              onClick={scrollPrev}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-white hover:shadow-sm"
              onClick={scrollNext}
              aria-label="Next slide"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div
        className={`overflow-hidden product-carousel-container rounded-lg bg-white shadow-sm p-4 marquee-${direction}`}
        ref={emblaRef}
        style={{ borderTop: `3px solid ${accentColor}` }}
      >
        {isLoading ? (
          <div className="flex space-x-4 px-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="flex-[0_0_85%] min-w-0 sm:flex-[0_0_50%] md:flex-[0_0_33.33%] lg:flex-[0_0_25%] xl:flex-[0_0_20%]"
              >
                <div className="bg-white rounded-md shadow-sm p-3 h-full">
                  <Skeleton className="w-full h-40 mb-3" />
                  <Skeleton className="w-3/4 h-4 mb-2" />
                  <Skeleton className="w-1/2 h-4 mb-2" />
                  <Skeleton className="w-1/3 h-4 mb-4" />
                  <Skeleton className="w-full h-8" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex marquee-track">
            {/* Double the products to create seamless continuous effect */}
            {[...products, ...products].map((product: Product, i) => (
              <div
                key={`${product.id}-${i}`}
                className="flex-[0_0_85%] min-w-0 pl-4 sm:flex-[0_0_50%] md:flex-[0_0_33.33%] lg:flex-[0_0_25%] xl:flex-[0_0_20%] marquee-item transition-transform duration-300 hover:scale-[0.98]"
              >
                <div className="mx-1">
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    image={product.image}
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                    badge={product.badge}
                    discount={product.discount}
                    stock={product.stock}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ProductCarousel: React.FC = () => {
  // Queries for both product types
  const { data: dealsProducts = [], isLoading: isDealsLoading } = useQuery<
    Product[]
  >({
    queryKey: ["/api/products/deals"],
  });

  const { data: topSellingProducts = [], isLoading: isTopSellingLoading } =
    useQuery<Product[]>({
      queryKey: ["/api/products/top-selling"],
    });

  return (
    <section className="py-8 px-4 max-w-7xl mx-auto">
      {/* Deals Carousel - Scrolling from right to left */}
      <MarqueeCarousel
        title="Deal of the Day"
        icon={<Tag className="h-5 w-5 text-red-500" />}
        products={dealsProducts}
        isLoading={isDealsLoading}
        filterType="deals"
        direction="left"
        speed={3000}
        accentColor="#E53935"
      />

      {/* Top Selling Carousel - Scrolling from left to right */}
      <MarqueeCarousel
        title="Top Selling Products"
        icon={<Award className="h-5 w-5 text-blue-600" />}
        products={topSellingProducts}
        isLoading={isTopSellingLoading}
        filterType="top-selling"
        direction="right"
        speed={4000}
        accentColor="#1F51A9"
      />

      <style>
        {`
          .product-carousel-container {
            position: relative;
            transition: all 0.3s ease;
            border: 1px solid transparent;
            overflow: hidden;
          }
          
          .product-carousel-container:hover {
            box-shadow: 0 6px 20px rgba(0,0,0,0.08);
            border-color: #f0f0f0;
          }
          
          .product-carousel-container:hover .marquee-track {
            animation-play-state: paused;
          }
          
          .marquee-track {
            display: flex;
            transition: all 0.5s ease;
          }
          
          .marquee-item {
            flex-shrink: 0;
          }
          
          /* Marquee animation styling */
          .marquee-left .marquee-track {
            animation: marqueeLeft 60s linear infinite;
          }
          
          .marquee-right .marquee-track {
            animation: marqueeRight 60s linear infinite;
          }
          
          @keyframes marqueeLeft {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          
          @keyframes marqueeRight {
            from { transform: translateX(-50%); }
            to { transform: translateX(0); }
          }
          
          /* Add a subtle gradient mask at the edges for better visual effect */
          .product-carousel-container::before,
          .product-carousel-container::after {
            content: '';
            position: absolute;
            top: 0;
            width: 50px;
            height: 100%;
            z-index: 2;
            pointer-events: none;
          }
          
          .product-carousel-container::before {
            left: 0;
            background: linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0));
          }
          
          .product-carousel-container::after {
            right: 0;
            background: linear-gradient(to left, rgba(255,255,255,1), rgba(255,255,255,0));
          }
        `}
      </style>
    </section>
  );
};

export default ProductCarousel;
