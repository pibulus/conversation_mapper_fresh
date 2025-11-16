// ===================================================================
// SMART THEME RANDOMIZER
// Generates fresh 2-3 color combos with proper contrast
// ===================================================================

export interface Theme {
  // Core colors (2-3 color system)
  primary: string;      // Main brand color
  secondary: string;    // Accent/interactive elements
  tertiary?: string;    // Optional highlight color

  // Text colors (always dark for legibility)
  text: string;         // Primary text
  textMuted: string;    // Secondary text

  // Surface colors (always light)
  bg: string;           // Main background
  surface: string;      // Card/panel background
  border: string;       // Borders

  // Shadows
  shadow: string;       // Drop shadows
}

/**
 * Generate a random HSL color within constraints
 */
function randomHSL(
  hueMin: number,
  hueMax: number,
  satMin: number,
  satMax: number,
  lightMin: number,
  lightMax: number
): string {
  const h = Math.floor(Math.random() * (hueMax - hueMin) + hueMin);
  const s = Math.floor(Math.random() * (satMax - satMin) + satMin);
  const l = Math.floor(Math.random() * (lightMax - lightMin) + lightMin);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Convert HSL to hex (for shadows)
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate a smart random theme
 * Ensures good contrast and legibility
 */
export function generateRandomTheme(): Theme {
  // Pick a random primary hue (full spectrum)
  const primaryHue = Math.floor(Math.random() * 360);

  // Secondary is 120-180 degrees away (complementary or triadic)
  const secondaryHue = (primaryHue + Math.floor(Math.random() * 60 + 120)) % 360;

  // Optional tertiary is 60-90 degrees from primary
  const useTertiary = Math.random() > 0.3; // 70% chance of 3-color
  const tertiaryHue = (primaryHue + Math.floor(Math.random() * 30 + 60)) % 360;

  // Generate colors with good saturation and brightness
  const primary = randomHSL(primaryHue, primaryHue + 10, 70, 95, 55, 70);
  const secondary = randomHSL(secondaryHue, secondaryHue + 10, 70, 95, 55, 70);
  const tertiary = useTertiary ? randomHSL(tertiaryHue, tertiaryHue + 10, 70, 95, 60, 75) : undefined;

  // Text is always dark for readability
  const text = '#1a1a1a';
  const textMuted = '#4a4a4a';

  // Backgrounds are always light
  const bg = randomHSL(primaryHue, primaryHue + 20, 20, 40, 96, 99);
  const surface = '#ffffff';
  const border = randomHSL(primaryHue, primaryHue + 20, 30, 50, 88, 94);

  // Shadow uses primary color at low opacity
  const shadowHue = primaryHue;
  const shadowHex = hslToHex(shadowHue, 75, 60);
  const shadow = `${shadowHex}40`; // 25% opacity

  return {
    primary,
    secondary,
    tertiary,
    text,
    textMuted,
    bg,
    surface,
    border,
    shadow
  };
}

/**
 * Apply theme to CSS custom properties
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;

  console.log('🎨 Applying theme');

  const root = document.documentElement;

  // Set CSS custom properties
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-secondary', theme.secondary);
  root.style.setProperty('--color-tertiary', theme.tertiary || theme.primary);
  root.style.setProperty('--color-text', theme.text);
  root.style.setProperty('--color-text-muted', theme.textMuted);
  root.style.setProperty('--color-bg', theme.bg);
  root.style.setProperty('--color-surface', theme.surface);
  root.style.setProperty('--color-border', theme.border);
  root.style.setProperty('--shadow-color', theme.shadow);

  console.log('✅ Theme applied');
}
