import React from 'react';
import { cn } from '@/lib/utils';

interface LogoSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
}

/**
 * A spinning logo component that can replace Loader2 throughout the app.
 * Uses the BBM Annex logo with a rotating animation.
 */
export const LogoSpinner: React.FC<LogoSpinnerProps> = ({ 
  size = 'sm',
  className = '',
  showBorder = true
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const borderSizeClasses = {
    xs: 'border',
    sm: 'border-2',
    md: 'border-2',
    lg: 'border-[3px]',
    xl: 'border-4'
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', sizeClasses[size], className)}>
      {showBorder && (
        <div 
          className={cn(
            'absolute inset-0 rounded-full border-primary/20 border-t-primary animate-spin',
            borderSizeClasses[size]
          )} 
        />
      )}
      <img 
        src="/android-chrome-512x512.png" 
        alt="" 
        className={cn('rounded-full object-cover', showBorder ? 'w-[80%] h-[80%]' : 'w-full h-full animate-spin')}
      />
    </div>
  );
};

export default LogoSpinner;
