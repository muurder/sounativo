import { useEffect } from 'react';

const BASE_URL = 'https://sounativo.vercel.app';
const DEFAULT_TITLE = 'SouNativo | Experiências Autênticas de Viagem pelo Brasil';
const DEFAULT_DESCRIPTION =
  'Marketplace brasileiro de viagens autorais. Conectamos viajantes a agências verificadas e guias credenciados Cadastur em todo o Brasil.';
const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80';
const JSON_LD_ID = 'sounativo-route-jsonld';

export interface PageMetaOptions {
  title: string;
  description?: string;
  image?: string;
  canonicalPath?: string;
  ogType?: 'website' | 'product' | 'profile';
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | null;
}

function upsertMetaTag(attribute: 'name' | 'property', key: string, content: string): void {
  if (typeof document === 'undefined') return;
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertCanonicalLink(href: string): void {
  if (typeof document === 'undefined') return;
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function applyPageMeta(options: PageMetaOptions): void {
  if (typeof document === 'undefined') return;

  const fullTitle = options.title.includes('SouNativo')
    ? options.title
    : `${options.title} | SouNativo`;
  const description = (options.description?.trim() || DEFAULT_DESCRIPTION).slice(0, 300);
  const image =
    options.image && /^https?:\/\//i.test(options.image) ? options.image : DEFAULT_OG_IMAGE;
  const cleanPath = options.canonicalPath
    ? options.canonicalPath.startsWith('/')
      ? options.canonicalPath
      : `/${options.canonicalPath}`
    : typeof window !== 'undefined'
      ? window.location.pathname
      : '/';
  const canonicalUrl = `${BASE_URL}${cleanPath}`;
  const ogType = options.ogType ?? 'website';

  document.title = fullTitle;
  upsertMetaTag('name', 'description', description);
  upsertMetaTag('name', 'robots', options.noIndex ? 'noindex, nofollow' : 'index, follow');

  upsertMetaTag('property', 'og:title', fullTitle);
  upsertMetaTag('property', 'og:description', description);
  upsertMetaTag('property', 'og:image', image);
  upsertMetaTag('property', 'og:url', canonicalUrl);
  upsertMetaTag('property', 'og:type', ogType);

  upsertMetaTag('name', 'twitter:card', 'summary_large_image');
  upsertMetaTag('name', 'twitter:title', fullTitle);
  upsertMetaTag('name', 'twitter:description', description);
  upsertMetaTag('name', 'twitter:image', image);

  upsertCanonicalLink(canonicalUrl);

  const existingJsonLd = document.getElementById(JSON_LD_ID);
  if (options.jsonLd) {
    const script = (existingJsonLd as HTMLScriptElement | null) ?? document.createElement('script');
    script.id = JSON_LD_ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(options.jsonLd);
    if (!existingJsonLd) {
      document.head.appendChild(script);
    }
  } else if (existingJsonLd) {
    existingJsonLd.remove();
  }
}

export function usePageMeta(options: PageMetaOptions): void {
  const { title, description, image, canonicalPath, ogType, noIndex, jsonLd } = options;
  const serializedJsonLd = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    applyPageMeta({
      title: title || DEFAULT_TITLE,
      description,
      image,
      canonicalPath,
      ogType,
      noIndex,
      jsonLd: serializedJsonLd ? (JSON.parse(serializedJsonLd) as Record<string, unknown>) : null,
    });

    return () => {
      const routeJsonLd = document.getElementById(JSON_LD_ID);
      if (routeJsonLd) {
        routeJsonLd.remove();
      }
    };
  }, [canonicalPath, description, image, noIndex, ogType, serializedJsonLd, title]);
}
