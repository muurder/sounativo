export interface ConsentCategories {
  essential: true; // Always required for core site operation, Auth and security
  analytics: boolean; // Anonymous traffic analysis, Core Web Vitals, Google Analytics
  marketing: boolean; // Conversion tracking, retargeting pixels (Meta, Google Ads)
}

export interface UserConsentState {
  categories: ConsentCategories;
  hasResponded: boolean;
  version: string;
  updatedAt: string;
}

export const CURRENT_CONSENT_VERSION = '2026-v1.0';
export const CONSENT_STORAGE_KEY = 'sounativo_privacy_consent_v1';
