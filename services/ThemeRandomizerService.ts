// ===================================================================
// THEME RANDOMIZER SERVICE (Golden Master Constrained)
// OKLCH color system locked to SoftStack pink-peach-cream universe
// All themes must orbit around the Golden Master - no drift allowed
// ===================================================================

import {
  GOLDEN_MASTER_THEME,
  GOLDEN_MASTER_GRADIENT,
  RANDOMIZER_CONSTRAINTS,
  constrainHueToSoftStack,
  isHueInSoftStackRange,
} from './GoldenMasterTheme.ts';

/**
 * SOFTSTACK THEME RANDOMIZER
 *
 * This randomizer generates themes that MUST stay within the SoftStack universe:
 * - Pink-peach-cream hues ONLY (320-40°)
 * - ±10% sat/bright variance from Golden Master
 * - No blues, greens, teals, purples
 * - No pure whites, no cold greys
 * - Shadow/glow geometry NEVER changes
 */

export class ThemeRandomizerService {
  // Cache for color generation to improve performance
  private static colorCache = new Map<string, string>();
  private static MAX_CACHE_SIZE = 50;

  /**
   * Returns a random value between min (inclusive) and max (exclusive).
   */
  static getRandomValue(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * Generate a hue within SoftStack range (pink-peach-cream: 320-40°)
   */
  static generateSoftStackHue(): number {
    // Randomly choose pink side (320-360) or cream side (0-40)
    if (Math.random() > 0.5) {
      // Pink side: 320-360
      return this.getRandomValue(320, 360);
    } else {
      // Cream/peach side: 0-40
      return this.getRandomValue(0, 40);
    }
  }

  /**
   * Generate a nearby hue (for harmony) within SoftStack range
   */
  static generateNearbyHue(baseHue: number, offsetDegrees: number): number {
    const newHue = (baseHue + offsetDegrees) % 360;
    return constrainHueToSoftStack(newHue);
  }

  /**
   * Ensures colors fall within gamut by adjusting chroma while preserving lightness and hue.
   */
  static ensureInGamut(lightness: number, chroma: number, hue: number): string {
    // Browser-only check - skip if not in browser context
    if (typeof document === 'undefined') {
      return `oklch(${lightness}% ${chroma} ${hue})`;
    }

    // Start with requested values
    let adjustedChroma = chroma;

    // Binary search to find maximum in-gamut chroma
    if (chroma > 0.1) {
      let min = 0;
      let max = chroma;
      const testEl = document.createElement('div');

      try {
        document.body.appendChild(testEl);

        for (let i = 0; i < 8; i++) { // 8 iterations is typically sufficient
          adjustedChroma = (min + max) / 2;
          testEl.style.color = `oklch(${lightness}% ${adjustedChroma} ${hue})`;

          // Check if computed style matches what we set
          const computed = getComputedStyle(testEl).color;
          if (computed !== 'rgba(0, 0, 0, 0)' && computed !== 'transparent') {
            min = adjustedChroma;
          } else {
            max = adjustedChroma;
          }
        }
      } finally {
        // Ensure cleanup happens even if error occurs
        if (testEl.parentNode) {
          document.body.removeChild(testEl);
        }
      }
    }

    return `oklch(${lightness}% ${adjustedChroma} ${hue})`;
  }

  /**
   * Generates an OKLCH color string with caching for performance.
   */
  static generateOKLCHColor(lightness: number, chroma: number, hue: number): string {
    // Round values to reduce cache misses
    const roundedL = Math.round(lightness * 10) / 10;
    const roundedC = Math.round(chroma * 100) / 100;
    const roundedH = Math.round(hue);

    const cacheKey = `${roundedL}-${roundedC}-${roundedH}`;

    // Check cache first
    if (this.colorCache.has(cacheKey)) {
      return this.colorCache.get(cacheKey)!;
    }

    // Check for in-gamut color
    const color = this.ensureInGamut(roundedL, roundedC, roundedH);

    // Implement LRU-like cache management
    if (this.colorCache.size >= this.MAX_CACHE_SIZE) {
      // Delete oldest entry (first key)
      const firstKey = this.colorCache.keys().next().value;
      this.colorCache.delete(firstKey);
    }

    this.colorCache.set(cacheKey, color);
    return color;
  }

  /**
   * Generate SoftStack triad harmony (pink-peach-cream)
   * All hues stay within 320-40° range
   */
  static generateSoftStackTriad(): { pink: number; peach: number; cream: number } {
    // Base hue in pink range (330-350)
    const pink = this.getRandomValue(330, 350);

    // Peach: slightly warmer (offset +20-35°, wraps to 0-40 range)
    const peach = (pink + this.getRandomValue(20, 35)) % 360;

    // Cream: warmest (offset +30-50°, wraps to 0-40 range)
    const cream = (pink + this.getRandomValue(30, 50)) % 360;

    return {
      pink: constrainHueToSoftStack(pink),
      peach: constrainHueToSoftStack(peach),
      cream: constrainHueToSoftStack(cream),
    };
  }

  /**
   * Generate chroma (saturation) within ±10% of Golden Master
   */
  static generateConstrainedChroma(baseChroma: number): number {
    const variance = baseChroma * RANDOMIZER_CONSTRAINTS.chromaVariance;
    return this.getRandomValue(
      Math.max(0.05, baseChroma - variance), // min: 0.05 to avoid grey
      baseChroma + variance
    );
  }

  /**
   * Generate lightness within ±10% of Golden Master
   */
  static generateConstrainedLightness(baseLightness: number): number {
    const variance = baseLightness * RANDOMIZER_CONSTRAINTS.lightnessVariance;
    return this.getRandomValue(
      Math.max(90, baseLightness - variance), // min: 90% to stay light
      Math.min(99, baseLightness + variance)  // max: 99% to avoid pure white
    );
  }

  /**
   * Generate SoftStack gradient (pink-peach-cream three-stop, warm only)
   * NO blues, greens, or cool tones allowed
   */
  static generateSoftStackGradient(): string {
    const triad = this.generateSoftStackTriad();

    // Very high lightness (96-98), very low chroma (0.03-0.07)
    // This creates the warm cream with subtle blush effect
    const lightness1 = this.getRandomValue(96, 97);
    const lightness2 = this.getRandomValue(96.5, 97.5);
    const lightness3 = this.getRandomValue(97, 98);

    const chroma1 = this.getRandomValue(0.04, 0.07);
    const chroma2 = this.getRandomValue(0.03, 0.06);
    const chroma3 = this.getRandomValue(0.03, 0.05);

    // Generate three-stop gradient using triad
    const color1 = this.generateOKLCHColor(lightness1, chroma1, triad.pink);
    const color2 = this.generateOKLCHColor(lightness2, chroma2, triad.peach);
    const color3 = this.generateOKLCHColor(lightness3, chroma3, triad.cream);

    // Gentle angle (135 ± 30°)
    const angle = 135 + this.getRandomValue(-30, 30);

    return `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 50%, ${color3} 100%)`;
  }

  /**
   * Applies theme colors to CSS custom properties.
   * NEVER modifies shadow/glow geometry - those are Golden Master constants.
   */
  static applyTheme(theme: Record<string, string>): void {
    if (typeof document === 'undefined') return;

    requestAnimationFrame(() => {
      const root = document.documentElement;

      // Apply color variables only (not shadows/glows)
      for (const [key, value] of Object.entries(theme)) {
        if (key.startsWith('--color-') || key === '--gradient-bg' || key.startsWith('--soft-') || key.startsWith('--pink-') || key.startsWith('--peach-') || key.startsWith('--rose-')) {
          root.style.setProperty(key, value);
        }
      }

      // Update module tokens (derived from theme)
      const shell = this.pickSolid(theme['--soft-cream'], '#FFF7EF');
      const wash = this.pickSolid(theme['--soft-cream-dark'], '#FAF3E9');
      const accent = this.pickSolid(theme['--color-accent'], '#ff5c8d');

      root.style.setProperty('--module-ink', '#1E1714'); // Never randomize
      root.style.setProperty('--module-shell', shell);
      root.style.setProperty('--module-wash', wash);
      root.style.setProperty('--accent-electric', accent);

      // Shadow and glow geometry are LOCKED to Golden Master (handled in CSS)
      // We do NOT override them here
    });
  }

  private static pickSolid(value: string | undefined, fallback: string): string {
    if (!value) return fallback;
    if (value.includes('gradient')) {
      const hexMatch = value.match(/#[0-9A-Fa-f]{6}/);
      if (hexMatch) return hexMatch[0];
      return fallback;
    }
    return value;
  }

  /**
   * Generate random SoftStack theme (constrained to Golden Master neighborhood)
   */
  static randomizeTheme(): Record<string, string> {
    // Generate SoftStack triad (all hues stay in 320-40° range)
    const triad = this.generateSoftStackTriad();

    // Generate constrained chroma values (±10% of Golden Master)
    const baseChroma = this.generateConstrainedChroma(RANDOMIZER_CONSTRAINTS.baseChroma);
    const accentChroma = this.generateConstrainedChroma(RANDOMIZER_CONSTRAINTS.accentChroma);

    // Generate constrained lightness values (±10% of Golden Master)
    const baseLightness = this.generateConstrainedLightness(RANDOMIZER_CONSTRAINTS.baseLightness);
    const accentLightness = this.generateConstrainedLightness(RANDOMIZER_CONSTRAINTS.accentLightness);

    // Create color palette using SoftStack triad
    const colorPalette = {
      // Core SoftStack colors (never randomize structural neutrals)
      '--soft-black': '#1E1714',
      '--soft-brown': '#3A2A22',

      // Cream backgrounds (slight variation allowed)
      '--soft-cream': this.generateOKLCHColor(
        this.getRandomValue(96.5, 98),
        this.getRandomValue(0.02, 0.04),
        triad.cream
      ),
      '--soft-cream-dark': this.generateOKLCHColor(
        this.getRandomValue(95, 97),
        this.getRandomValue(0.03, 0.05),
        triad.cream
      ),

      // Pastel accents (pink-peach-cream variations)
      '--pink-light': this.generateOKLCHColor(
        this.getRandomValue(92, 95),
        accentChroma * 0.6,
        triad.pink
      ),
      '--peach-light': this.generateOKLCHColor(
        this.getRandomValue(92, 95),
        accentChroma * 0.55,
        triad.peach
      ),
      '--rose-glow': this.generateOKLCHColor(
        this.getRandomValue(85, 90),
        accentChroma * 0.7,
        triad.pink
      ),

      // Legacy theme variables (for compatibility)
      '--color-accent': this.generateOKLCHColor(
        accentLightness,
        accentChroma * 0.8,
        triad.pink
      ),
      '--color-secondary': this.generateOKLCHColor(
        accentLightness + 5,
        accentChroma * 0.6,
        triad.peach
      ),
      '--color-text': '#1E1714', // Always soft-black
      '--color-text-secondary': '#3A2A22', // Always soft-brown
      '--color-border': 'rgba(30, 23, 20, 0.1)', // Warm neutral

      // Base color (used in some legacy places)
      '--color-base-solid': this.generateOKLCHColor(
        baseLightness,
        baseChroma,
        triad.cream
      ),
    };

    // Apply colors immediately
    this.applyTheme(colorPalette);

    // Generate SoftStack gradient (deferred for performance)
    requestAnimationFrame(() => {
      const gradientBg = this.generateSoftStackGradient();

      // Update gradient
      document.documentElement.style.setProperty('--gradient-bg', gradientBg);
      colorPalette['--gradient-bg'] = gradientBg;

      // Add grain texture overlay (1-2% opacity)
      // This is done via CSS ::after pseudo-element in the .mapper-scene class
    });

    return colorPalette;
  }
}
