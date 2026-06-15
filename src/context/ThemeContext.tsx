import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isSystemTheme: boolean;   // true when following OS, false when user overrode
  resetToSystem: () => void; // clears override and re-follows OS
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Separate key so the old auto-saved 'theme' key never counts as a user override
const OVERRIDE_KEY = 'ez-theme-override';   // 'light' | 'dark' | null
const LEGACY_KEY   = 'theme';               // old key — we clear it on first run

const getSystemTheme = (): Theme =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- Bootstrap ---
  const [isSystemTheme, setIsSystemTheme] = useState<boolean>(() => {
    // Clear the old always-written legacy key so it doesn't poison the new logic
    localStorage.removeItem(LEGACY_KEY);
    return localStorage.getItem(OVERRIDE_KEY) === null;
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    const override = localStorage.getItem(OVERRIDE_KEY) as Theme | null;
    // Only trust override key (set only by explicit user action)
    if (override === 'light' || override === 'dark') return override;
    return getSystemTheme();
  });

  // --- Apply dark class to <html> ---
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // --- Live OS listener ---
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (isSystemTheme) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [isSystemTheme]);

  // --- Toggle (user explicit action) ---
  const toggleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setThemeState(next);
    setIsSystemTheme(false);
    localStorage.setItem(OVERRIDE_KEY, next);
  };

  // --- Reset to system ---
  const resetToSystem = () => {
    localStorage.removeItem(OVERRIDE_KEY);
    setIsSystemTheme(true);
    setThemeState(getSystemTheme());
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isSystemTheme, resetToSystem }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
