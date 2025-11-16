// ===================================================================
// THEME STORE
// Simple preset-based theme system with localStorage persistence
// ===================================================================

import { signal, effect } from "@preact/signals";
import { THEMES, applyTheme as applyThemeStyles, getRandomTheme, type Theme } from "./themes.ts";

// Create the theme signal - start with first theme (Soft Pink)
export const themeSignal = signal<Theme>(THEMES[0]);

// Storage key for localStorage
const THEME_STORAGE_KEY = 'conversation-mapper-theme';

// Track if theme system is initialized
let isInitialized = false;

/**
 * Load theme from localStorage
 */
export function loadThemeFromStorage(): Theme | null {
  if (typeof localStorage === 'undefined') return null;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const themeName = stored;
      // Find theme by name
      const theme = THEMES.find(t => t.name === themeName);
      return theme || null;
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
    // Just store the theme name
    localStorage.setItem(THEME_STORAGE_KEY, theme.name);
  } catch (error) {
    console.error('Error saving theme to storage:', error);
  }
}

/**
 * Initialize theme system
 */
export function initializeTheme(): void {
  // Prevent duplicate initialization
  if (isInitialized) return;
  isInitialized = true;

  console.log('🎨 Initializing theme system...');

  // Try to load from localStorage
  const stored = loadThemeFromStorage();
  if (stored) {
    console.log('🎨 Loaded theme from localStorage:', stored.name);
    themeSignal.value = stored;
    applyThemeStyles(stored);
  } else {
    console.log('🎨 No stored theme, using Soft Pink default');
    applyThemeStyles(THEMES[0]);
  }

  // Set up effect to save theme when it changes
  effect(() => {
    const currentTheme = themeSignal.value;
    saveThemeToStorage(currentTheme);
    applyThemeStyles(currentTheme);
  });

  console.log('✅ Theme system initialized');
}

/**
 * Randomize theme - pick a random preset
 */
export function randomizeTheme(): void {
  console.log('🎨 Shuffling theme...');
  const newTheme = getRandomTheme();
  console.log('🎨 Selected theme:', newTheme.name);
  themeSignal.value = newTheme;
  console.log('✅ Theme applied');
}

/**
 * Apply a specific theme by name
 */
export function applyTheme(themeName: string): void {
  const theme = THEMES.find(t => t.name === themeName);
  if (theme) {
    themeSignal.value = theme;
  }
}

/**
 * Get current theme
 */
export function getCurrentTheme(): Theme {
  return themeSignal.value;
}

/**
 * Get all available themes
 */
export function getAvailableThemes(): Theme[] {
  return THEMES;
}
