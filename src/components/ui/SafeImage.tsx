import React, { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import { sanitizeImageSrc } from '@/utils/securitySanitizer';

const INLINE_SVG_FALLBACK = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e7e5e4"/><stop offset="100%" stop-color="#d6d3d1"/></linearGradient></defs><rect width="800" height="500" fill="url(#g)"/><path d="M0 390 L220 230 L390 350 L570 190 L800 370 L800 500 L0 500 Z" fill="#a8a29e" opacity="0.45"/></svg>'
)}`;

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = '',
  fallbackSrc,
  className,
  ...props
}) => {
  const defaultFallback = fallbackSrc
    ? sanitizeImageSrc(fallbackSrc, INLINE_SVG_FALLBACK)
    : INLINE_SVG_FALLBACK;
  const [imgSrc, setImgSrc] = useState(() => sanitizeImageSrc(src, defaultFallback));

  useEffect(() => {
    setImgSrc(sanitizeImageSrc(src, defaultFallback));
  }, [defaultFallback, src]);

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      className={cn('overflow-hidden', className)}
      onError={() => {
        if (imgSrc !== defaultFallback) {
          setImgSrc(defaultFallback);
        } else if (imgSrc !== INLINE_SVG_FALLBACK) {
          setImgSrc(INLINE_SVG_FALLBACK);
        }
      }}
    />
  );
};
