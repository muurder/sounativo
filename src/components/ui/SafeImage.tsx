import React, { useEffect, useState } from 'react';
import { getDailyHeroImage } from '@/utils/dailyHeroImage';
import { sanitizeImageSrc } from '@/utils/securitySanitizer';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({ src, alt = '', fallbackSrc, ...props }) => {
  const defaultFallback = fallbackSrc || getDailyHeroImage();
  const [imgSrc, setImgSrc] = useState(() => sanitizeImageSrc(src, defaultFallback));

  useEffect(() => {
    setImgSrc(sanitizeImageSrc(src, defaultFallback));
  }, [defaultFallback, src]);

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => {
        if (imgSrc !== defaultFallback) {
          setImgSrc(defaultFallback);
        }
      }}
    />
  );
};
