import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeColors = {
  isDark: boolean;
  bg: string;
  card: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  surface: string;
  overlay: string;
};

type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('system');
  const value = useMemo(() => ({ mode, setMode }), [mode]);
  return React.createElement(ThemeContext.Provider, { value }, children as any);
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider');
  return ctx;
}

export function useThemeColors(): ThemeColors {
  const system = useColorScheme();
  const { mode } = useThemeMode();
  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';
  if (isDark) {
    return {
      isDark,
      bg: '#1a0d2e',
      card: '#2d1b3d',
      cardBorder: 'rgba(254,209,65,0.15)',
      textPrimary: '#fed141',
      textSecondary: '#c4a7d1',
      accent: '#fed141',
      surface: 'rgba(45,27,61,0.9)',
      overlay: 'rgba(108,42,132,0.6)'
    };
  }
  return {
    isDark: false,
    bg: '#fef7e8',
    card: '#ffffff',
    cardBorder: 'rgba(108,42,132,0.1)',
    textPrimary: '#6c2a84',
    textSecondary: '#8b4f9f',
    accent: '#6c2a84',
    surface: 'rgba(255,255,255,0.95)',
    overlay: 'rgba(108,42,132,0.06)'
  };
}
