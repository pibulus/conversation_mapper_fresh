// ===================================================================
// THEME STORE
// Simple preset-based theme system with localStorage persistence
// ===================================================================

import { signal, effect } from "@preact/signals";
import { generateRandomTheme, applyTheme as applyThemeStyles, type Theme } from "./themes.ts";

// Create the theme signal - generate initial random theme
export const themeSignal = signal<Theme>(generateRandomTheme());

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
      return JSON.parse(stored) as Theme;
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
  // Prevent duplicate initialization
  if (isInitialized) return;
  isInitialized = true;

  console.log('🎨 Initializing theme system...');

  // Try to load from localStorage
  const stored = loadThemeFromStorage();
  if (stored) {
    console.log('🎨 Loaded theme from localStorage');
    themeSignal.value = stored;
    applyThemeStyles(stored);
  } else {
    console.log('🎨 Generating fresh random theme');
    const fresh = generateRandomTheme();
    themeSignal.value = fresh;
    applyThemeStyles(fresh);
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
 * Randomize theme - generate new random colors
 */
export function randomizeTheme(): void {
  console.log('🎨 Shuffling theme...');
  const newTheme = generateRandomTheme();
  themeSignal.value = newTheme;
  console.log('✅ New theme applied');
}

/**
 * Get current theme
 */
export function getCurrentTheme(): Theme {
  return themeSignal.value;
}
