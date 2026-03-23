import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface AnalyticsEvent {
  event: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const useAnalytics = () => {
  const location = useLocation();

  const trackPageView = useCallback((url: string, title?: string) => {
    if (typeof window !== 'undefined') {
      if (window.gtag) {
        window.gtag('config', process.env.VITE_GA_ID || 'GA_NOT_CONFIGURED', {
          page_path: url,
          page_title: title || document.title,
        });
      }
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'page_view',
          page_path: url,
          page_title: title || document.title,
        });
      }
    }
  }, []);

  const trackEvent = useCallback(({ event, category, label, value, ...rest }: AnalyticsEvent) => {
    if (typeof window !== 'undefined') {
      if (window.gtag) {
        window.gtag('event', event, {
          event_category: category,
          event_label: label,
          value: value,
          ...rest,
        });
      }
      if (window.dataLayer) {
        window.dataLayer.push({
          event,
          event_category: category,
          event_label: label,
          value,
          ...rest,
        });
      }
    }
    console.log('[Analytics]', { event, category, label, value, ...rest });
  }, []);

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location, trackPageView]);

  return {
    trackPageView,
    trackEvent,
    trackLogin: (method: string) =>
      trackEvent({ event: 'login', category: 'engagement', label: method }),
    trackSignup: (method: string) =>
      trackEvent({ event: 'sign_up', category: 'engagement', label: method }),
    trackSearch: (searchTerm: string, resultsCount: number) =>
      trackEvent({
        event: 'search',
        category: 'engagement',
        label: searchTerm,
        value: resultsCount,
      }),
    trackBooking: (tripId: string, price: number) =>
      trackEvent({
        event: 'booking',
        category: 'conversion',
        label: tripId,
        value: price,
      }),
    trackViewTrip: (tripId: string, tripName: string) =>
      trackEvent({
        event: 'view_trip',
        category: 'engagement',
        label: tripName,
        trip_id: tripId,
      }),
    trackClick: (element: string, location: string) =>
      trackEvent({
        event: 'click',
        category: 'engagement',
        label: `${location}:${element}`,
      }),
    trackError: (errorMessage: string, errorType: string) =>
      trackEvent({
        event: 'error',
        category: 'error',
        label: errorType,
        error_message: errorMessage,
      }),
  };
};

export default useAnalytics;

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const analytics = useAnalytics();

  useEffect(() => {
    analytics.trackPageView(location.pathname + location.search);
  }, [location, analytics]);

  return <>{children}</>;
};
