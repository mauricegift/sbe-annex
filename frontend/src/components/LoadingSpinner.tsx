import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'lg', 
  text = 'Loading...',
  className = '',
  fullScreen = true
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const spinnerContent = (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="relative">
        {/* Rotating border */}
        <div className={`${sizeClasses[size]} rounded-full border-4 border-primary/20 border-t-primary animate-spin absolute inset-0`} />
        {/* Logo image with shimmer effect */}
        <div className="relative overflow-hidden rounded-full">
          <img 
            src="/android-chrome-512x512.png" 
            alt="BBM Annex" 
            className={`${sizeClasses[size]} rounded-full object-cover`}
          />
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>
      {text && <p className="text-muted-foreground font-medium">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

// Inline loading spinner for buttons and small areas
export const InlineSpinner: React.FC<{ size?: 'xs' | 'sm' | 'md'; className?: string }> = ({ 
  size = 'sm',
  className = ''
}) => {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full border-2 border-primary/20 border-t-primary animate-spin absolute inset-0`} />
      <div className="relative overflow-hidden rounded-full">
        <img 
          src="/android-chrome-512x512.png" 
          alt="" 
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>
    </div>
  );
};

export default LoadingSpinner;
