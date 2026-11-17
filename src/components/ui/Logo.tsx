import React from 'react';
import { Leaf, MapPin } from 'lucide-react';
import { cn } from '@/utils/cn';

interface LogoProps {
  className?: string;
  showText?: boolean;
  iconSize?: number;
  variant?: 'default' | 'light';
}

export const Logo: React.FC<LogoProps> = ({
  className,
  showText = true,
  iconSize = 28,
  variant = 'default',
}) => {
  const isLight = variant === 'light';

  return (
    <div className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <div className="relative flex items-center justify-center shrink-0" aria-hidden="true">
        <Leaf
          size={Math.round(iconSize * 0.46)}
          className={cn(
            'absolute -top-1 -right-1 z-10',
            isLight
              ? 'text-secondary-200 fill-secondary-200/30'
              : 'text-secondary-500 fill-secondary-500/20'
          )}
        />
        <MapPin
          size={iconSize}
          strokeWidth={2.4}
          className={cn(
            isLight ? 'text-white fill-white/15' : 'text-primary-500 fill-primary-500/10'
          )}
        />
      </div>

      {showText && (
        <span className="font-serif text-2xl font-bold tracking-tight whitespace-nowrap leading-none">
          <span className={isLight ? 'text-white' : 'text-stone-900'}>Sou</span>
          <span className={isLight ? 'text-secondary-200' : 'text-primary-500'}>Nativo</span>
        </span>
      )}
    </div>
  );
};
