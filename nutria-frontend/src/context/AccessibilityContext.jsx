/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext(null);

const STORAGE_KEY = 'nutria_accessibility_settings';

export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading accessibility settings:', e);
    }
    return {
      fontSize: 'normal',       // 'normal' | 'large' | 'xlarge'
      highContrast: false,      // boolean
      theme: 'healthy-dark',    // 'healthy-dark' | 'healthy-light'
      reducedMotion: false,     // boolean
    };
  });

  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Error saving accessibility settings:', e);
    }

    // Aplicar clases al elemento <html>
    const root = document.documentElement;

    // 1. Tema
    if (settings.theme === 'healthy-light') {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
    } else {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
    }

    // 2. Tamaño de texto
    root.classList.remove('text-size-normal', 'text-size-large', 'text-size-xlarge');
    root.classList.add(`text-size-${settings.fontSize}`);

    // 3. Alto contraste
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // 4. Reducción de movimiento
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleTheme = () => {
    updateSetting('theme', settings.theme === 'healthy-light' ? 'healthy-dark' : 'healthy-light');
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSetting,
        toggleTheme,
        isAccessibilityModalOpen,
        setIsAccessibilityModalOpen
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility debe ser utilizado dentro de AccessibilityProvider');
  }
  return context;
}

