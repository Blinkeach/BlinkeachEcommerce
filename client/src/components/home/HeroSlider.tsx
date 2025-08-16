import React, { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import offerImage from "@/assets/blinkeach slider (1)_1755144360578.jpg";
import upiDiscountImage from "@/assets/upi dis 1_imresizer_1755144360581.jpg";
import bulkOrderImage from "@/assets/YouTube Banner - Wholesale Deals Today (1) (1)_1755144360582.jpg";
import newArrivalsImage from "@/assets/From Cart to Doorstep_1755144360581.jpg";

interface SlideProps {
  id: number;
  title: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
}

const slides: SlideProps[] = [
  {
    id: 1,
    title: "BLINK EACH",
    description: "UP TO 40% OFF ON ALL PRODUCTS - SHOP NOW",
    image: offerImage,
    buttonText: "Shop Now",
    buttonLink: "/shop",
  },
  {
    id: 2,
    title: "From Cart to Doorstep", 
    description: "Blinkeach isn't just shopping — it's exploring a world of endless possibilities, one blink at a time",
    image: newArrivalsImage,
    buttonText: "Explore Now",
    buttonLink: "/shop",
  },
  {
    id: 3,
    title: "UPI Payment Discount",
    description: "01% OFF ON ONLINE PAYMENT & 05% OFF ON PURCHASE OF 1K OR ABOVE",
    image: upiDiscountImage,
    buttonText: "Shop Now",
    buttonLink: "/shop",
  },
  {
    id: 4,
    title: "Wholesale Orders",
    description: "Multi-Item Order in Bulk - Contact on 8274019912",
    image: bulkOrderImage,
    buttonText: "Contact Now",
    buttonLink: "/contact",
  },
];

const HeroSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, []);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-scroll effect
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        nextSlide();
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isPaused, nextSlide]);

  return (
    <section
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="relative min-w-full"
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-auto object-contain"
                loading={slide.id === 1 ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                <div className="text-white p-6 md:p-12 max-w-xl">
                  <h2 className="text-2xl md:text-4xl font-bold mb-2">
                    {slide.title}
                  </h2>
                  <p className="text-sm md:text-base mb-4">
                    {slide.description}
                  </p>
                  <Link href={slide.buttonLink}>
                    <Button className="bg-accent hover:bg-accent-dark text-white py-2 px-6 rounded-md font-medium transition-colors">
                      {slide.buttonText}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors md:flex hidden"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors md:flex hidden"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Slider Nav dots */}
      <div className="absolute bottom-3 left-0 right-0">
        <div className="flex justify-center space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full ${index === currentSlide ? "bg-white" : "bg-white/50"}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;
