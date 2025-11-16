// ===================================================================
// SIMPLE THEME SYSTEM - Inspired by slideomatic
// Preset color combos with proper contrast and legibility
// ===================================================================

export interface Theme {
  name: string;

  // Core colors (3-color system for clarity)
  primary: string;      // Main brand color
  secondary: string;    // Accent/interactive elements
  tertiary: string;     // Highlights/badges

  // Text colors
  text: string;         // Primary text
  textMuted: string;    // Secondary text

  // Surface colors
  bg: string;           // Main background
  surface: string;      // Card/panel background
  border: string;       // Borders

  // Shadows
  shadow: string;       // Drop shadows
}

// Default theme - Bright pink spectrum with good contrast
const SOFT_PINK: Theme = {
  name: 'Soft Pink',
  primary: '#ff6b9d',      // Bright pink
  secondary: '#ffd4e5',    // Light pink
  tertiary: '#ffb6d9',     // Medium pink
  text: '#1a1a1a',         // Almost black for readability
  textMuted: '#4a4a4a',    // Dark gray
  bg: '#fffbf8',           // Warm white
  surface: '#fff',         // Pure white cards
  border: '#ffe0ec',       // Light pink border
  shadow: 'rgba(255, 107, 157, 0.15)'
};

// Vaporwave - Inspired by slideomatic
const VAPORWAVE: Theme = {
  name: 'Vaporwave',
  primary: '#01cdfe',      // Cyan
  secondary: '#b967ff',    // Purple
  tertiary: '#fffb96',     // Yellow
  text: '#1a0033',         // Deep purple (readable on light bg)
  textMuted: '#5e336b',    // Muted purple
  bg: '#ff71ce',           // Hot pink background
  surface: 'rgba(255, 113, 206, 0.82)',  // Semi-transparent pink
  border: '#01cdfe',       // Cyan borders
  shadow: 'rgba(1, 205, 254, 0.3)'
};

// Fresh Citrus - Cyan/Mauve/Grapefruit combo
const CITRUS: Theme = {
  name: 'Fresh Citrus',
  primary: '#00d9ff',      // Cyan
  secondary: '#c77dff',    // Mauve
  tertiary: '#ff6b6b',     // Grapefruit
  text: '#2d2d2d',         // Dark gray
  textMuted: '#6b6b6b',    // Medium gray
  bg: '#fffef9',           // Off-white
  surface: '#fff',         // White
  border: '#e0e0e0',       // Light gray
  shadow: 'rgba(0, 217, 255, 0.2)'
};

// Peach Dream - Warm pastels
const PEACH: Theme = {
  name: 'Peach Dream',
  primary: '#ffb088',      // Peach
  secondary: '#ffd4a3',    // Light peach
  tertiary: '#ff9b71',     // Dark peach
  text: '#3d2817',         // Dark brown
  textMuted: '#6b4423',    // Medium brown
  bg: '#fffbf3',           // Cream
  surface: '#fff',         // White
  border: '#ffe5cc',       // Light peach
  shadow: 'rgba(255, 176, 136, 0.2)'
};

// Mint Fresh - Cool and clean
const MINT: Theme = {
  name: 'Mint Fresh',
  primary: '#5eead4',      // Mint
  secondary: '#a7f3d0',    // Light mint
  tertiary: '#2dd4bf',     // Teal
  text: '#134e4a',         // Dark teal
  textMuted: '#2f7370',    // Medium teal
  bg: '#f0fdfa',           // Mint white
  surface: '#fff',         // White
  border: '#ccfbf1',       // Light mint
  shadow: 'rgba(94, 234, 212, 0.2)'
};

export const THEMES = [SOFT_PINK, VAPORWAVE, CITRUS, PEACH, MINT];

/**
 * Apply theme to CSS custom properties
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;

  console.log('🎨 Applying theme:', theme.name);

  const root = document.documentElement;

  // Set CSS custom properties
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-secondary', theme.secondary);
  root.style.setProperty('--color-tertiary', theme.tertiary);
  root.style.setProperty('--color-text', theme.text);
  root.style.setProperty('--color-text-muted', theme.textMuted);
  root.style.setProperty('--color-bg', theme.bg);
  root.style.setProperty('--color-surface', theme.surface);
  root.style.setProperty('--color-border', theme.border);
  root.style.setProperty('--shadow-color', theme.shadow);

  console.log('✅ Theme applied');
}

/**
 * Get a random theme
 */
export function getRandomTheme(): Theme {
  const index = Math.floor(Math.random() * THEMES.length);
  return THEMES[index];
}

/**
 * Get theme by name
 */
export function getThemeByName(name: string): Theme | undefined {
  return THEMES.find(t => t.name === name);
}
