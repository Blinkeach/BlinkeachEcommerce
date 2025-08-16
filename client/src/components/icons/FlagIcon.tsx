import React from 'react';

interface FlagIconProps {
  countryCode: string;
  className?: string;
  size?: number;
}

export const FlagIcon: React.FC<FlagIconProps> = ({ countryCode, className = "", size = 20 }) => {
  const flagComponents = {
    'in': <IndiaFlag size={size} className={className} />,
    'gb': <UKFlag size={size} className={className} />,
    'us': <USFlag size={size} className={className} />
  };

  return flagComponents[countryCode as keyof typeof flagComponents] || <IndiaFlag size={size} className={className} />;
};

// India Flag Component
const IndiaFlag: React.FC<{ size: number; className: string }> = ({ size, className }) => (
  <svg
    width={size}
    height={(size * 2) / 3}
    viewBox="0 0 30 20"
    className={`${className} rounded-sm border border-gray-200`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="30" height="20" fill="#FF9933" />
    <rect y="6.67" width="30" height="6.67" fill="#FFFFFF" />
    <rect y="13.33" width="30" height="6.67" fill="#138808" />
    <circle cx="15" cy="10" r="3" fill="none" stroke="#000080" strokeWidth="0.4" />
    <g transform="translate(15,10)">
      {Array.from({ length: 24 }, (_, i) => (
        <line
          key={i}
          x1="0"
          y1="0"
          x2="2.5"
          y2="0"
          stroke="#000080"
          strokeWidth="0.15"
          transform={`rotate(${i * 15})`}
        />
      ))}
    </g>
  </svg>
);

// UK Flag Component
const UKFlag: React.FC<{ size: number; className: string }> = ({ size, className }) => (
  <svg
    width={size}
    height={(size * 3) / 5}
    viewBox="0 0 30 18"
    className={`${className} rounded-sm border border-gray-200`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="30" height="18" fill="#012169" />
    <g stroke="#FFFFFF" strokeWidth="1.8">
      <path d="M0,0 L30,18 M30,0 L0,18" />
      <path d="M15,0 L15,18 M0,9 L30,9" strokeWidth="3" />
    </g>
    <g stroke="#C8102E" strokeWidth="1.2">
      <path d="M0,0 L30,18 M30,0 L0,18" />
      <path d="M15,0 L15,18 M0,9 L30,9" strokeWidth="1.8" />
    </g>
  </svg>
);

// US Flag Component  
const USFlag: React.FC<{ size: number; className: string }> = ({ size, className }) => (
  <svg
    width={size}
    height={(size * 10) / 19}
    viewBox="0 0 30 16"
    className={`${className} rounded-sm border border-gray-200`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="30" height="16" fill="#B22234" />
    {Array.from({ length: 7 }, (_, i) => (
      <rect key={i} y={i * 2.3} width="30" height="1.15" fill="#FFFFFF" />
    ))}
    <rect width="12" height="8.6" fill="#3C3B6E" />
  </svg>
);