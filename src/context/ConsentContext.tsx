import React, { createContext, useCallback, useEffect, useState } from 'react';
import {
  ConsentCategories,
  CONSENT_STORAGE_KEY,
  CURRENT_CONSENT_VERSION,
  UserConsentState,
} from '@/types/consent';
import { applyConsentToScripts } from '@/utils/cookieSecurity';
import { recordConsentAuditLog } from '@/services/privacyService';

export interface ConsentContextValue {
  consent: ConsentCategories;
  hasResponded: boolean;
  isOpen: boolean;
  openConsentBanner: () => void;
  closeConsentBanner: () => void;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  saveCustomConsent: (prefs: { analytics: boolean; marketing: boolean }) => void;
}

const DEFAULT_CONSENT: ConsentCategories = {
  essential: true,
  analytics: false,
  marketing: false,
};

export const ConsentContext = createContext<ConsentContextValue | undefined>(undefined);

function readInitialConsent(): UserConsentState {
  if (typeof window === 'undefined') {
    return {
      categories: DEFAULT_CONSENT,
      hasResponded: false,
      version: CURRENT_CONSENT_VERSION,
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserConsentState;
      if (parsed && typeof parsed === 'object' && parsed.categories) {
        return {
          categories: {
            essential: true,
            analytics: Boolean(parsed.categories.analytics),
            marketing: Boolean(parsed.categories.marketing),
          },
          hasResponded: Boolean(parsed.hasResponded),
          version: parsed.version || CURRENT_CONSENT_VERSION,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
      }
    }
  } catch {
    // Fallback if localStorage is corrupt or blocked
  }

  return {
    categories: DEFAULT_CONSENT,
    hasResponded: false,
    version: CURRENT_CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  };
}

export const ConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<UserConsentState>(readInitialConsent);
  const [isOpen, setIsOpen] = useState<boolean>(!state.hasResponded);

  // Apply script blocking on mount and whenever consent categories change
  useEffect(() => {
    applyConsentToScripts(state.categories);
  }, [state.categories]);

  const persistConsent = useCallback((categories: ConsentCategories) => {
    const nextState: UserConsentState = {
      categories: { ...categories, essential: true },
      hasResponded: true,
      version: CURRENT_CONSENT_VERSION,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      // Safe catch for private browsing restrictions
    }

    setState(nextState);
    setIsOpen(false);
    applyConsentToScripts(nextState.categories);
    void recordConsentAuditLog(nextState.categories, CURRENT_CONSENT_VERSION);
  }, []);

  const acceptAll = useCallback(() => {
    persistConsent({ essential: true, analytics: true, marketing: true });
  }, [persistConsent]);

  const rejectNonEssential = useCallback(() => {
    persistConsent({ essential: true, analytics: false, marketing: false });
  }, [persistConsent]);

  const saveCustomConsent = useCallback(
    (prefs: { analytics: boolean; marketing: boolean }) => {
      persistConsent({
        essential: true,
        analytics: Boolean(prefs.analytics),
        marketing: Boolean(prefs.marketing),
      });
    },
    [persistConsent]
  );

  const openConsentBanner = useCallback(() => setIsOpen(true), []);
  const closeConsentBanner = useCallback(() => setIsOpen(false), []);

  return (
    <ConsentContext.Provider
      value={{
        consent: state.categories,
        hasResponded: state.hasResponded,
        isOpen,
        openConsentBanner,
        closeConsentBanner,
        acceptAll,
        rejectNonEssential,
        saveCustomConsent,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
};
