import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useRouteChange } from '@/context/RouteChangeContext';

interface LoadingIndicatorProps {
  position?: 'top' | 'center';
  color?: string;
}

export function LoadingIndicator({ 
  position = 'top',
  color = 'secondary'
}: LoadingIndicatorProps) {
  const { isChangingRoute, progress } = useRouteChange();
  const [showLoader, setShowLoader] = useState(false);
  
  // Add a slight delay before showing the loader to avoid flashing
  // for quick navigation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isChangingRoute) {
      timer = setTimeout(() => {
        setShowLoader(true);
      }, 100);
    } else {
      setShowLoader(false);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isChangingRoute]);
  
  if (!isChangingRoute && !showLoader) return null;

  // Get the color class based on the color prop
  const getColorClass = () => {
    switch (color) {
      case 'primary':
        return 'bg-primary';
      case 'secondary':
        return 'bg-secondary';
      case 'destructive':
        return 'bg-destructive';
      default:
        return 'bg-secondary';
    }
  };
  
  const getTextColorClass = () => {
    switch (color) {
      case 'primary':
        return 'text-primary';
      case 'secondary':
        return 'text-secondary';
      case 'destructive':
        return 'text-destructive';
      default:
        return 'text-secondary';
    }
  };
  
  if (position === 'top') {
    return (
      <AnimatePresence>
        {(showLoader || isChangingRoute) && (
          <motion.div
            className={`fixed top-0 left-0 right-0 z-50 h-1 ${getColorClass()}`}
            initial={{ width: '0%', opacity: 1 }}
            animate={{ 
              width: `${progress}%`,
              opacity: 1 
            }}
            exit={{ 
              width: '100%', 
              opacity: 0,
              transition: { duration: 0.3 }
            }}
            transition={{
              duration: 0.3,
              ease: "easeInOut"
            }}
          />
        )}
      </AnimatePresence>
    );
  }
  
  return (
    <AnimatePresence>
      {(showLoader || isChangingRoute) && (
        <motion.div 
          className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-full p-3 shadow-xl relative"
          >
            <Loader2 className={`h-8 w-8 ${getTextColorClass()} animate-spin`} />
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-white bg-black/70 px-2 py-0.5 rounded-md">
              {Math.round(progress)}%
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}