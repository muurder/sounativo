const FALLBACK_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80&auto=format&fit=crop',
] as const;

export function getDailyHeroImage(customPool: string[] = []): string {
  const pool = customPool.length > 0 ? customPool : [...FALLBACK_HERO_IMAGES];
  const now = new Date();
  const key = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash &= hash;
  }
  return pool[Math.abs(hash) % pool.length] ?? FALLBACK_HERO_IMAGES[0];
}
