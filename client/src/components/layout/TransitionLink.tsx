import React from 'react';
import { useLocation, useRoute } from 'wouter';
import { useRouteChange } from '@/context/RouteChangeContext';

interface TransitionLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * TransitionLink - A component for navigating with smooth page transitions
 */
const TransitionLink: React.FC<TransitionLinkProps> = ({
  href,
  children,
  className = '',
  activeClassName = '',
  onClick,
}) => {
  const [, navigate] = useLocation();
  const [isActive] = useRoute(href);
  const { startRouteChange } = useRouteChange();
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }
    
    if (
      !e.defaultPrevented && // onClick prevented default
      e.button === 0 && // primary mouse button
      !(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) // without modifier keys
    ) {
      e.preventDefault();
      
      // Start the route change animation
      startRouteChange();
      
      // Add a small delay to allow for animation to start
      setTimeout(() => {
        navigate(href);
      }, 50);
    }
  };

  return (
    <a
      href={href}
      className={`${className} ${isActive ? activeClassName : ''}`}
      onClick={handleClick}
    >
      {children}
    </a>
  );
};

export default TransitionLink;