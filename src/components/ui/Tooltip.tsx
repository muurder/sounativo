import React, { useId, useState } from 'react';
import { cn } from '@/utils/cn';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className,
}) => {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span
      className={cn('relative inline-flex items-center', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {React.cloneElement(children, { 'aria-describedby': open ? tooltipId : undefined })}
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            'pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 whitespace-nowrap rounded-lg',
            'bg-stone-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg animate-fade-in',
            position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
};
