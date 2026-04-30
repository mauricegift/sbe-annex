import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';

interface MobileOptimizedCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const MobileOptimizedCard: React.FC<MobileOptimizedCardProps> = ({
  title,
  description,
  children,
  className
}) => {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg sm:text-xl md:text-2xl">{title}</CardTitle>
        {description && (
          <CardDescription className="text-sm">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
};

export default MobileOptimizedCard;