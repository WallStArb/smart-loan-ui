import React from 'react';

interface FISSmartLoanLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark' | 'gradient';
  showSubtext?: boolean;
  className?: string;
}

const FISSmartLoanLogo: React.FC<FISSmartLoanLogoProps> = ({ 
  size = 'md', 
  variant = 'light',
  showSubtext = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: { title: 'text-lg', subtitle: 'text-xs', spacing: 'space-x-2' },
    md: { title: 'text-lg', subtitle: 'text-xs', spacing: 'space-x-3' },
    lg: { title: 'text-xl', subtitle: 'text-sm', spacing: 'space-x-4' }
  };

  const currentSize = sizeClasses[size];

  const getTextClasses = () => {
    switch (variant) {
      case 'light':
        return {
          fis: 'text-[#00a651]',
          smartloan: 'text-white',
          subtitle: 'text-gray-300',
          separator: 'text-gray-400'
        };
      case 'dark':
        return {
          fis: 'text-[#00a651]',
          smartloan: 'text-gray-900',
          subtitle: 'text-gray-600',
          separator: 'text-gray-400'
        };
      case 'gradient':
        return {
          fis: 'text-[#00a651]',
          smartloan: 'bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent',
          subtitle: 'text-gray-300',
          separator: 'text-gray-400'
        };
      default:
        return {
          fis: 'text-[#00a651]',
          smartloan: 'text-white',
          subtitle: 'text-gray-300',
          separator: 'text-gray-400'
        };
    }
  };

  const textClasses = getTextClasses();

  return (
    <div className={`flex items-center ${currentSize.spacing} ${className}`}>
      <div className="flex flex-col">
        <div className={`fis-headline leading-tight ${currentSize.title} flex items-center`}>
          <span className={textClasses.fis}>FIS</span>
          <span className={`mx-1.5 ${textClasses.separator}`}>|</span>
          <span className={`${textClasses.smartloan}`}>SMARTLOAN</span>
        </div>
        
        {showSubtext && (
          <div className={`fis-body-semibold uppercase tracking-wide ${currentSize.subtitle} ${textClasses.subtitle}`}>
            Securities Lending Platform
          </div>
        )}
      </div>
    </div>
  );
};

export default FISSmartLoanLogo; 