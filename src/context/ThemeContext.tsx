import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AgencyTheme, ThemeColors } from '@/types';

export interface AgencyBrandHeader {
  name: string;
  slug: string;
  logo: string;
}

const DEFAULT_AGENCY_THEME: AgencyTheme = {
  colors: {
    primary: '#0F4C3A',
    secondary: '#C66B3D',
    background: '#FAFAF9',
    text: '#1C1917',
  },
  fontPair: 'classic',
  borderRadius: 'soft',
  buttonStyle: 'solid',
  headerStyle: 'solid',
};

function hexToRgb(hex: string): [number, number, number] {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return [15, 76, 58];
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

const mixChannel = (base: number, target: number, weight: number): number =>
  Math.round(base + (target - base) * weight);

const tint = (rgb: [number, number, number], weight: number): string =>
  `${mixChannel(rgb[0], 255, weight)} ${mixChannel(rgb[1], 255, weight)} ${mixChannel(rgb[2], 255, weight)}`;

const shade = (rgb: [number, number, number], weight: number): string =>
  `${mixChannel(rgb[0], 0, weight)} ${mixChannel(rgb[1], 0, weight)} ${mixChannel(rgb[2], 0, weight)}`;

interface ThemeContextValue {
  colors: ThemeColors;
  agencyTheme: AgencyTheme;
  agencyBrand: AgencyBrandHeader | null;
  isCustomAgencyTheme: boolean;
  setAgencyTheme: (themeOrColors: AgencyTheme | ThemeColors) => void;
  setAgencyBrand: (brand: AgencyBrandHeader | null) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [agencyTheme, setAgencyThemeState] = useState<AgencyTheme>(DEFAULT_AGENCY_THEME);
  const [agencyBrand, setAgencyBrand] = useState<AgencyBrandHeader | null>(null);
  const [isCustomAgencyTheme, setIsCustomAgencyTheme] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const primary = hexToRgb(agencyTheme.colors.primary);
    const secondary = hexToRgb(agencyTheme.colors.secondary);

    root.style.setProperty('--color-primary-50', tint(primary, 0.9));
    root.style.setProperty('--color-primary-100', tint(primary, 0.8));
    root.style.setProperty('--color-primary-200', tint(primary, 0.6));
    root.style.setProperty('--color-primary-300', tint(primary, 0.4));
    root.style.setProperty('--color-primary-400', tint(primary, 0.2));
    root.style.setProperty('--color-primary-500', `${primary[0]} ${primary[1]} ${primary[2]}`);
    root.style.setProperty('--color-primary-600', shade(primary, 0.2));
    root.style.setProperty('--color-primary-700', shade(primary, 0.4));
    root.style.setProperty('--color-primary-800', shade(primary, 0.6));
    root.style.setProperty('--color-primary-900', shade(primary, 0.8));

    root.style.setProperty('--color-secondary-50', tint(secondary, 0.9));
    root.style.setProperty('--color-secondary-100', tint(secondary, 0.8));
    root.style.setProperty(
      '--color-secondary-500',
      `${secondary[0]} ${secondary[1]} ${secondary[2]}`
    );
    root.style.setProperty('--color-secondary-600', shade(secondary, 0.2));
    root.style.setProperty('--color-secondary-700', shade(secondary, 0.4));
    root.style.setProperty('--color-secondary-800', shade(secondary, 0.6));
  }, [agencyTheme]);

  const setAgencyTheme = useCallback((themeOrColors: AgencyTheme | ThemeColors) => {
    if ('colors' in themeOrColors) {
      setAgencyThemeState(themeOrColors);
    } else {
      setAgencyThemeState({ ...DEFAULT_AGENCY_THEME, colors: themeOrColors });
    }
    setIsCustomAgencyTheme(true);
  }, []);

  const resetTheme = useCallback(() => {
    setAgencyThemeState(DEFAULT_AGENCY_THEME);
    setAgencyBrand(null);
    setIsCustomAgencyTheme(false);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        colors: agencyTheme.colors,
        agencyTheme,
        agencyBrand,
        isCustomAgencyTheme,
        setAgencyTheme,
        setAgencyBrand,
        resetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  return ctx;
}
