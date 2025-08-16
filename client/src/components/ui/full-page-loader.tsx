import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShoppingBag, Sparkles, Gift } from 'lucide-react';

interface FullPageLoaderProps {
  brandName?: string;
}

export function FullPageLoader({ brandName = 'Blinkeach' }: FullPageLoaderProps) {
  const [loadingText, setLoadingText] = useState('Preparing your experience');
  const [progress, setProgress] = useState(0);
  
  // Simulate loading progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 5;
      });
    }, 150);
    
    return () => clearInterval(interval);
  }, []);
  
  // Update loading text based on progress
  useEffect(() => {
    if (progress < 30) {
      setLoadingText('Preparing your experience');
    } else if (progress < 60) {
      setLoadingText('Loading products');
    } else if (progress < 85) {
      setLoadingText('Personalizing your store');
    } else {
      setLoadingText('Almost ready');
    }
  }, [progress]);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-r from-white to-gray-50 flex flex-col items-center justify-center">
      <div className="text-center max-w-md px-4">
        {/* Brand Logo/Name */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-5xl font-bold text-primary mb-2">{brandName}</h1>
          <p className="text-gray-500 text-sm">Your online shopping destination</p>
        </motion.div>
        
        {/* Loader Animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12 relative"
        >
          <div className="relative h-28 w-28 mx-auto">
            {/* Outer circle */}
            <motion.div 
              className="absolute inset-0 rounded-full border-4 border-primary/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Middle circle */}
            <motion.div 
              className="absolute inset-2 rounded-full border-4 border-primary/30"
              animate={{ rotate: -180 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Inner circle with gradient */}
            <motion.div 
              className="absolute inset-4 rounded-full border-4 border-t-primary border-r-primary/70 border-b-primary/50 border-l-primary/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Animated icons */}
            <div className="absolute inset-0">
              <motion.div 
                className="absolute"
                animate={{ 
                  rotate: [0, 360],
                  x: [0, 8, 0, -8, 0],
                  y: [0, -8, 0, 8, 0],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                style={{ top: '15%', left: '50%', x: '-50%' }}
              >
                <ShoppingBag className="h-4 w-4 text-primary" />
              </motion.div>
              
              <motion.div 
                className="absolute"
                animate={{ 
                  rotate: [0, -360],
                  x: [0, -8, 0, 8, 0],
                  y: [0, 8, 0, -8, 0],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 0.5 }}
                style={{ bottom: '15%', left: '50%', x: '-50%' }}
              >
                <Gift className="h-4 w-4 text-primary" />
              </motion.div>
              
              <motion.div 
                className="absolute"
                animate={{ 
                  rotate: [0, 180, 360],
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{ top: '50%', left: '50%', x: '-50%', y: '-50%' }}
              >
                <Sparkles className="h-6 w-6 text-primary" />
              </motion.div>
            </div>
          </div>
        </motion.div>
        
        {/* Progress Bar */}
        <motion.div 
          className="h-1 bg-gray-200 rounded-full w-full mb-4 overflow-hidden"
          initial={{ opacity: 0, width: '60%' }}
          animate={{ opacity: 1, width: '100%' }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <motion.div 
            className="h-full bg-primary rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
        
        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={loadingText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-gray-600 text-lg"
            >
              {loadingText}...
            </motion.p>
          </AnimatePresence>
          
          <div className="mt-3 flex justify-center space-x-1">
            <motion.div 
              className="h-2 w-2 rounded-full bg-primary"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatType: "loop", delay: 0 }}
            />
            <motion.div 
              className="h-2 w-2 rounded-full bg-primary"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatType: "loop", delay: 0.2 }}
            />
            <motion.div 
              className="h-2 w-2 rounded-full bg-primary" 
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatType: "loop", delay: 0.4 }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}