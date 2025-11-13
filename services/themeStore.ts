// ===================================================================
// THEME STORE
// Preact signals-based theme management with localStorage persistence
// ===================================================================

import { signal, effect } from "@preact/signals";
import { ThemeRandomizerService } from "./ThemeRandomizerService.ts";

// Type for theme data
export interface Theme {
  harmony?: string;
  [key: string]: string | undefined;
}

// Default theme
const defaultTheme: Theme = {
  '--color-base': 'linear-gradient(135deg, #FFEBD4 0%, #FFD9B8 100%)',
  '--color-base-solid': '#FFEBD4',
  '--color-secondary': 'rgba(255, 255, 255, 0.6)',
  '--color-accent': '#E8839C',
  '--color-text': '#3D3935',
  '--color-text-secondary': '#8B7F77',
  '--color-border': 'rgba(61, 57, 53, 0.1)',
  '--gradient-bg': 'linear-gradient(to bottom right, #FFE5D4, #FF9A76)'
};

// Create the theme signal
export const themeSignal = signal<Theme>(defaultTheme);

// Storage key for localStorage
const THEME_STORAGE_KEY = 'conversation-mapper-theme';

/**
 * Load theme from localStorage
 */
export function loadThemeFromStorage(): Theme | null {
  if (typeof localStorage === 'undefined') return null;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading theme from storage:', error);
  }

  return null;
}

/**
 * Save theme to localStorage
 */
export function saveThemeToStorage(theme: Theme): void {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  } catch (error) {
    console.error('Error saving theme to storage:', error);
  }
}

/**
 * Initialize theme system
 */
export function initializeTheme(): void {
  // Try to load from localStorage
  const stored = loadThemeFromStorage();
  if (stored) {
    themeSignal.value = stored;
    ThemeRandomizerService.applyTheme(stored);
  }

  // Set up effect to save theme when it changes
  effect(() => {
    const currentTheme = themeSignal.value;
    saveThemeToStorage(currentTheme);
  });
}

/**
 * Randomize theme and apply it
 */
export function randomizeTheme(): void {
  const newTheme = ThemeRandomizerService.randomizeTheme();
  themeSignal.value = newTheme;
}

/**
 * Apply a specific theme
 */
export function applyTheme(theme: Theme): void {
  themeSignal.value = theme;
  ThemeRandomizerService.applyTheme(theme);
}

/**
 * Get current theme
 */
export function getCurrentTheme(): Theme {
  return themeSignal.value;
}
