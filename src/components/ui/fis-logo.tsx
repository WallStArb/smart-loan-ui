import React from 'react';

interface FISLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon' | 'text';
  className?: string;
}

const FISLogo: React.FC<FISLogoProps> = ({ 
  size = 'md', 
  variant = 'full',
  className = ''
}) => {
  const sizeClasses = {
    sm: { width: 60, height: 20, fontSize: '16px' },
    md: { width: 80, height: 28, fontSize: '20px' },
    lg: { width: 120, height: 40, fontSize: '28px' }
  };

  const currentSize = sizeClasses[size];

  // Official FIS Logo SVG based on the provided image
  const FISLogoSVG = () => (
    <svg 
      width={currentSize.width} 
      height={currentSize.height} 
      viewBox="0 0 120 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background with subtle gradient */}
      <rect width="120" height="40" rx="6" fill="url(#gradient)" />
      
      {/* FIS Text */}
      <g fill="#00a651">
        {/* F */}
        <path d="M15 12h12v3h-8v4h7v3h-7v8h-4V12z" strokeWidth="0.5" stroke="#00a651"/>
        
        {/* I */}
        <rect x="35" y="12" width="4" height="18" />
        
        {/* S */}
        <path d="M48 12h12c2 0 3 1 3 3v2c0 2-1 3-3 3h-8c-1 0-1 1-1 1v1c0 1 1 1 1 1h11v3H51c-2 0-3-1-3-3v-2c0-2 1-3 3-3h8c1 0 1-1 1-1v-1c0-1-1-1-1-1H48v-3z"/>
      </g>
      
      {/* Gradient definition */}
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fffe" />
          <stop offset="100%" stopColor="#f0fdf4" />
        </linearGradient>
      </defs>
    </svg>
  );

  // Simple text-only version matching the official typography
  const FISText = () => (
    <div 
      className={`font-bold tracking-tight ${className}`}
      style={{ 
        fontSize: currentSize.fontSize,
        color: '#00a651',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      FIS
    </div>
  );

  // Icon version (simplified circular version)
  const FISIcon = () => (
    <div 
      className={`flex items-center justify-center rounded-lg shadow-sm ${className}`}
      style={{ 
        width: currentSize.height,
        height: currentSize.height,
        background: 'linear-gradient(135deg, #00a651 0%, #059669 100%)'
      }}
    >
      <span 
        className="font-bold text-white"
        style={{ fontSize: `${parseInt(currentSize.fontSize) * 0.6}px` }}
      >
        FIS
      </span>
    </div>
  );

  // Full logo with official styling
  if (variant === 'full') {
    return <FISLogoSVG />;
  }

  // Icon only
  if (variant === 'icon') {
    return <FISIcon />;
  }

  // Text only
  if (variant === 'text') {
    return <FISText />;
  }

  return null;
};

export default FISLogo; 