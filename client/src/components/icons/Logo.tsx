import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import blinkeachLogo from '../../assets/blinkeach-logo.jpg';

interface LogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  clickable?: boolean;
}

interface NavbarSettings {
  id?: number;
  logoImage: string;
  redirectLink: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'medium', clickable = true }) => {
  const [, setLocation] = useLocation();
  
  // Fetch navbar settings to get the configured logo and redirect link
  const { data: navbarSettings } = useQuery<NavbarSettings>({
    queryKey: ['/api/navbar-settings'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Determine size classes
  const sizeClasses = {
    small: 'h-8',
    medium: 'h-12',
    large: 'h-16',
  };

  // Use configured logo or fallback to default
  const logoSrc = navbarSettings?.logoImage || blinkeachLogo;
  const redirectLink = navbarSettings?.redirectLink || '/';

  const handleClick = () => {
    if (clickable) {
      setLocation(redirectLink);
    }
  };

  // Use the configurable logo image with SVG fallback
  return (
    <div 
      className={`${sizeClasses[size]} ${className} flex items-center ${clickable ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      <div className="relative w-auto h-full">
        <img 
          src={logoSrc} 
          alt="Blinkeach Logo" 
          className="h-full w-auto object-contain"
          onError={(e) => {
            // If configured image fails to load, try default logo
            const target = e.currentTarget;
            if (target.src !== blinkeachLogo) {
              target.src = blinkeachLogo;
            } else {
              // If default also fails, show SVG version as fallback
              target.style.display = 'none';
              const svgContainer = target.nextElementSibling;
              if (svgContainer) {
                svgContainer.classList.remove('hidden');
              }
            }
          }}
        />
        
        {/* Fallback SVG if the image doesn't load */}
        <div className="hidden h-full w-auto">
          <svg width="100%" height="100%" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="800" height="800" fill="#F2BB1D" />
            
            {/* "be" logo */}
            <g transform="translate(240, 160) scale(3.2)">
              {/* Red b */}
              <path d="M50 40C50 37 52 35 55 35H70C90 35 95 60 75 60H50V40Z" fill="#E93323" />
              <path d="M50 60H70C90 60 95 85 75 85H50V60Z" fill="#E93323" />
              
              {/* Blue e */}
              <path d="M75 40C90 40 105 55 105 70C105 85 90 100 75 100C60 100 45 85 45 70C45 55 60 40 75 40Z" fill="#1A4EC7" />
              <path d="M75 50C85 50 95 60 95 70C95 80 85 90 75 90V50Z" fill="#F2BB1D" />
            </g>
            
            {/* blinkeach text */}
            <g transform="translate(100, 600) scale(1.5)">
              {/* "blink" in red */}
              <path d="M20 0H40V100H20V60C20 50 30 40 40 40C50 40 60 50 60 60V100H80V60C80 40 60 20 40 20C30 20 20 30 20 40V0Z" fill="#E93323" />
              <path d="M100 20H120V100H100V20Z" fill="#E93323" />
              <path d="M140 20H160V100H140V20Z" fill="#E93323" />
              <path d="M100 0H120V10H100V0Z" fill="#E93323" />
              <path d="M180 20H200V60C200 50 210 40 220 40C230 40 240 50 240 60V100H260V60C260 40 240 20 220 20C210 20 200 30 200 40V20H180Z" fill="#E93323" />
              <path d="M280 40H300C290 30 310 30 300 50L330 100H310L280 50V100H260V20H280V40Z" fill="#E93323" />
              
              {/* "each" in blue */}
              <path d="M340 60C340 80 360 100 380 100C400 100 420 80 420 60C420 40 400 20 380 20C360 20 340 40 340 60ZM360 60C360 50 370 40 380 40C390 40 400 50 400 60C400 70 390 80 380 80C370 80 360 70 360 60Z" fill="#1A4EC7" />
              <path d="M440 20H460V50C460 45 470 40 480 40C490 40 500 50 500 60V100H480V60C480 55 475 50 470 50C465 50 460 55 460 60V100H440V20Z" fill="#1A4EC7" />
              <path d="M520 60C520 40 540 20 560 20C575 20 585 30 590 40L575 50C570 45 565 40 560 40C550 40 540 50 540 60C540 70 550 80 560 80C565 80 570 75 575 70L590 80C585 90 575 100 560 100C540 100 520 80 520 60Z" fill="#1A4EC7" />
              <path d="M600 20H620V50C620 45 630 40 640 40C650 40 660 50 660 60V100H640V60C640 55 635 50 630 50C625 50 620 55 620 60V100H600V20Z" fill="#1A4EC7" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

// Export the same logo as LogoSvg for backward compatibility
export const LogoSvg = Logo;

export default Logo;
