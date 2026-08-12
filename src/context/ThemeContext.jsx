import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const AVAILABLE_THEMES = [
  {
    id: 'light',
    name: 'Claro Institucional',
    icon: 'Sun',
    badgeColor: 'bg-indigo-600',
    bgPreview: '#f8fafc',
    headerPreview: '#0f172a'
  },
  {
    id: 'dark',
    name: 'Oscuro Elegante',
    icon: 'Moon',
    badgeColor: 'bg-slate-900',
    bgPreview: '#090d16',
    headerPreview: '#030712'
  },
  {
    id: 'esmeralda',
    name: 'Bosque Esmeralda',
    icon: 'Trees',
    badgeColor: 'bg-emerald-700',
    bgPreview: '#f0fdf4',
    headerPreview: '#064e3b'
  },
  {
    id: 'burdeos',
    name: 'Burdeos Real',
    icon: 'Palette',
    badgeColor: 'bg-rose-800',
    bgPreview: '#fff1f2',
    headerPreview: '#4c0519'
  }
];

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('san_martin_theme') || 'light';
  });

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('san_martin_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes: AVAILABLE_THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
