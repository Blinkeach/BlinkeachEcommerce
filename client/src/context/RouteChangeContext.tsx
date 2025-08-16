import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';

interface RouteChangeContextType {
  isChangingRoute: boolean;
  previousPath: string | null;
  currentPath: string;
  progress: number;
  startRouteChange: () => void;
  completeRouteChange: () => void;
}

const RouteChangeContext = createContext<RouteChangeContextType>({
  isChangingRoute: false,
  previousPath: null,
  currentPath: '/',
  progress: 0,
  startRouteChange: () => {},
  completeRouteChange: () => {}
});

interface RouteChangeProviderProps {
  children: React.ReactNode;
}

export const RouteChangeProvider: React.FC<RouteChangeProviderProps> = ({ children }) => {
  const [location] = useLocation();
  const [isChangingRoute, setIsChangingRoute] = useState(false);
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(location);
  const [progress, setProgress] = useState(0);
  
  // Reset progress when a route change is completed
  const completeRouteChange = useCallback(() => {
    setIsChangingRoute(false);
    setProgress(100);
    
    // Reset progress after animation is done
    setTimeout(() => {
      setProgress(0);
    }, 300);
  }, []);
  
  // Manually start a route change
  const startRouteChange = useCallback(() => {
    setIsChangingRoute(true);
    setProgress(10);
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    
    return () => clearInterval(interval);
  }, []);

  // Handle automatic route changes from wouter
  useEffect(() => {
    if (location !== currentPath) {
      startRouteChange();
      setPreviousPath(currentPath);
      
      // Simulate the loading time
      const timer = setTimeout(() => {
        setCurrentPath(location);
        completeRouteChange();
      }, 500); // Match this with the animation duration
      
      return () => clearTimeout(timer);
    }
  }, [location, currentPath, startRouteChange, completeRouteChange]);

  return (
    <RouteChangeContext.Provider 
      value={{ 
        isChangingRoute, 
        previousPath, 
        currentPath, 
        progress,
        startRouteChange,
        completeRouteChange
      }}
    >
      {children}
    </RouteChangeContext.Provider>
  );
};

export const useRouteChange = () => useContext(RouteChangeContext);