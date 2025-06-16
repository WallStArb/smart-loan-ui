import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useDensityMode } from './density-toggle';

interface DateTimeDisplayProps {
  className?: string;
  showIcon?: boolean;
  showDate?: boolean;
  showSeconds?: boolean;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'card' | 'inline' | 'minimal';
  compactDate?: boolean; // When true, shows a more compact date format
}

export const DateTimeDisplay: React.FC<DateTimeDisplayProps> = ({
  className = '',
  showIcon = true,
  showDate = true,
  showSeconds = false,
  size = 'sm',
  variant = 'card',
  compactDate = false
}) => {
  const [time, setTime] = useState(new Date());
  const { density } = useDensityMode();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getFormattedTime = () => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };

    if (showSeconds) {
      options.second = '2-digit';
    }

    return time.toLocaleTimeString('en-US', options);
  };

  const getFormattedDate = () => {
    if (compactDate) {
      // More compact format: MM/DD (without year) or M/D
      return time.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric'
      });
    }
    
    return time.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  // Size classes for text and icons
  const sizeClasses = {
    xs: {
      text: 'text-xs',
      icon: 10,
      space: 'space-x-0.5'
    },
    sm: {
      text: 'text-xs',
      icon: 12,
      space: 'space-x-1'
    },
    md: {
      text: 'text-sm',
      icon: 14,
      space: 'space-x-1.5'
    }
  };

  const currentSize = sizeClasses[size];

  // Compact display for minimal variant
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center ${currentSize.space} ${className}`}>
        {showIcon && <Clock size={currentSize.icon} className="text-white/70" />}
        <div className="flex items-center space-x-1">
          {showDate && (
            <>
              <span className={`${currentSize.text} text-white/70`}>
                {getFormattedDate()}
              </span>
              <span className="text-white/50">•</span>
            </>
          )}
          <span className={`${currentSize.text} text-white font-medium`}>
            {getFormattedTime()}
          </span>
        </div>
      </div>
    );
  }

  // Inline display
  if (variant === 'inline') {
    return (
      <div className={`flex items-center ${currentSize.space} ${className}`}>
        {showIcon && <Clock size={currentSize.icon} className="text-white" />}
        <div className="flex flex-col">
          {showDate && (
            <span className={`${currentSize.text} text-white/70 leading-tight`}>
              {getFormattedDate()}
            </span>
          )}
          <span className={`${currentSize.text} text-white font-medium leading-tight`}>
            {getFormattedTime()}
          </span>
        </div>
      </div>
    );
  }

  // Card display (default)
  return (
    <Card className={`bg-white/20 border-white/30 backdrop-blur-sm ${className}`}>
      <CardContent className={density === 'compact' ? 'p-1.5' : 'p-2'}>
        <div className={`flex items-center ${currentSize.space}`}>
          {showIcon && <Clock size={currentSize.icon} className="text-white" />}
          <div className="flex flex-col">
            {showDate && (
              <span className={`${currentSize.text} text-white/70 leading-tight`}>
                {getFormattedDate()}
              </span>
            )}
            <span className={`${currentSize.text} text-white font-medium leading-tight`}>
              {getFormattedTime()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 