import React, { useState } from 'react';
import { getDailyHeroImage } from '@/utils/dailyHeroImage';
import { cn } from '@/utils/cn';

interface TripGalleryProps {
  images: string[];
  title: string;
}

export const TripGallery: React.FC<TripGalleryProps> = ({ images, title }) => {
  const gallery = images.length > 0 ? images : [getDailyHeroImage()];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fallbackActive, setFallbackActive] = useState(false);

  const activeSrc = fallbackActive ? getDailyHeroImage() : (gallery[selectedIndex] ?? gallery[0]);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-stone-100 aspect-[16/9]">
        <img
          src={activeSrc}
          alt={title}
          onError={() => setFallbackActive(true)}
          className="h-full w-full object-cover"
        />
      </div>

      {gallery.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {gallery.map((imgUrl, idx) => (
            <button
              key={`${imgUrl}-${idx}`}
              type="button"
              onClick={() => {
                setSelectedIndex(idx);
                setFallbackActive(false);
              }}
              aria-label={`Ver foto ${idx + 1} de ${title}`}
              className={cn(
                'h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all',
                selectedIndex === idx
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : 'border-stone-200 opacity-80 hover:opacity-100'
              )}
            >
              <img src={imgUrl} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
