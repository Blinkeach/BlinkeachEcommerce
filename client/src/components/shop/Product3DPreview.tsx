import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Maximize2, Minimize2, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product3DPreviewProps {
  images: string[];
  productName: string;
  selectedColor?: string;
  className?: string;
  model3d?: {url?: string, type?: string, scale?: number};
}

export default function Product3DPreview({
  images,
  productName,
  selectedColor = '',
  className = '',
  model3d
}: Product3DPreviewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationY, setRotationY] = useState(0);
  const [rotationX, setRotationX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const resetRotation = () => {
    setRotationY(0);
    setRotationX(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setAutoRotate(false);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;
    
    setRotationY(prev => prev + deltaX * 0.5);
    setRotationX(prev => Math.max(-30, Math.min(30, prev - deltaY * 0.5)));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const PreviewContent = () => (
    <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
      {/* 3D Preview Container */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing perspective-1000"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ perspective: '1000px' }}
      >
        <motion.div
          className="relative max-w-full max-h-full"
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateY(${autoRotate ? 0 : rotationY}deg) rotateX(${rotationX}deg)`,
          }}
          animate={{
            rotateY: autoRotate ? [0, 360] : rotationY,
          }}
          transition={{
            duration: autoRotate ? 8 : 0,
            ease: "linear",
            repeat: autoRotate ? Infinity : 0,
          }}
        >
          {/* Main Product Image or 3D Model */}
          <div className="relative">
            {model3d?.url ? (
              // Display 3D Model if available
              <div className="w-full h-full flex items-center justify-center">
                <model-viewer
                  src={model3d.url}
                  alt={productName}
                  auto-rotate={autoRotate}
                  camera-controls
                  style={{
                    width: '100%',
                    height: '400px',
                    '--poster-color': 'transparent',
                  }}
                  className="max-w-full max-h-full"
                />
                {/* 3D Model Badge */}
                <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  3D Model
                </div>
              </div>
            ) : (
              // Display regular product image
              <img
                src={images[currentImageIndex] || '/placeholder-product.jpg'}
                alt={productName}
                className="max-w-full max-h-full object-contain drop-shadow-2xl"
                style={{
                  filter: selectedColor ? `hue-rotate(${selectedColor === 'red' ? '0deg' : selectedColor === 'blue' ? '240deg' : selectedColor === 'green' ? '120deg' : '0deg'})` : 'none'
                }}
              />
            )}
            
            {/* Reflection Effect */}
            <div
              className="absolute top-full left-0 w-full h-1/2 opacity-20"
              style={{
                background: `linear-gradient(to bottom, transparent, rgba(0,0,0,0.1))`,
                transform: 'scaleY(-1)',
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)'
              }}
            >
              <img
                src={images[currentImageIndex] || '/placeholder-product.jpg'}
                alt=""
                className="w-full h-full object-contain"
                style={{
                  filter: selectedColor ? `hue-rotate(${selectedColor === 'red' ? '0deg' : selectedColor === 'blue' ? '240deg' : selectedColor === 'green' ? '120deg' : '0deg'})` : 'none'
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Image Navigation Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                currentImageIndex === index
                  ? 'bg-blue-500 scale-125'
                  : 'bg-white/50 backdrop-blur-sm hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={resetRotation}
          className="bg-white/80 backdrop-blur-sm"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`bg-white/80 backdrop-blur-sm ${autoRotate ? 'bg-blue-100' : ''}`}
        >
          {autoRotate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        {!isFullscreen && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="bg-white/80 backdrop-blur-sm"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Info Overlay */}
      <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2">
        <p className="text-sm text-gray-600">
          3D Preview • Drag to rotate • Click controls to interact
        </p>
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black"
        >
          <div className="w-full h-full">
            <PreviewContent />
          </div>
          
          {/* Fullscreen Exit */}
          <div className="absolute top-4 left-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="bg-white/20 backdrop-blur-sm text-white border-white/30"
            >
              <Minimize2 className="h-4 w-4 mr-2" />
              Exit Fullscreen
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className={`${className}`}>
      <PreviewContent />
    </div>
  );
}