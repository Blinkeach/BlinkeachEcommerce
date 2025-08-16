import { useEffect } from 'react';
import { useLocation } from 'wouter';

const ScrollToTop = () => {
  const [location] = useLocation();

  useEffect(() => {
    // Scroll to top when route changes with smooth behavior
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Use instant for route changes to avoid delay
    });
  }, [location]);

  useEffect(() => {
    // Scroll to top on page refresh/reload
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
    
    // Also handle browser back/forward navigation
    const handlePopState = () => {
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant'
        });
      }, 10);
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return null;
};

export default ScrollToTop;