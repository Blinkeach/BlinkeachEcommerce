import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';

interface PageTransitionProps {
  children: React.ReactNode;
  transitionKey?: string;
  effect?: 'fade' | 'slide' | 'zoom' | 'flip';
}

const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  transitionKey,
  effect = 'fade'
}) => {
  const [location] = useLocation();
  const key = transitionKey || location;

  // Different transition effects
  const fadeVariants = {
    initial: {
      opacity: 0,
    },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3,
      }
    }
  };

  const slideVariants = {
    initial: {
      opacity: 0,
      x: 20,
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.3,
      }
    }
  };

  const zoomVariants = {
    initial: {
      opacity: 0,
      scale: 0.98,
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }
    },
    exit: {
      opacity: 0,
      scale: 1.02,
      transition: {
        duration: 0.3,
      }
    }
  };

  const flipVariants = {
    initial: {
      opacity: 0,
      rotateX: 10,
      y: 10,
    },
    animate: {
      opacity: 1,
      rotateX: 0,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }
    },
    exit: {
      opacity: 0,
      rotateX: -10,
      y: -10,
      transition: {
        duration: 0.3,
      }
    }
  };

  // Select the right variant based on the effect prop
  const getVariants = () => {
    switch (effect) {
      case 'slide':
        return slideVariants;
      case 'zoom':
        return zoomVariants;
      case 'flip':
        return flipVariants;
      case 'fade':
      default:
        return fadeVariants;
    }
  };

  // Determine the effect based on the page being navigated to
  const getEffectByPath = (path: string) => {
    if (path.startsWith('/product')) {
      return zoomVariants;
    } else if (path.startsWith('/admin')) {
      return slideVariants;
    } else if (path.includes('login') || path.includes('register')) {
      return flipVariants;
    } else {
      return fadeVariants;
    }
  };

  const pageVariants = getEffectByPath(location);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={key}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className="min-h-[calc(100vh-5rem)] w-full" // Account for header height
        style={{ transformOrigin: 'center', perspective: '1200px' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;