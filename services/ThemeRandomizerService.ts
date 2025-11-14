// ===================================================================
// THEME RANDOMIZER SERVICE
// OKLCH color system with harmony algorithms and mesh gradients
// Ported from SvelteKit version, adapted for Fresh/Deno
// ===================================================================

// Constants for theme generation
const MIN_HUE_DISTANCE = 90;
const MAX_RETRIES = 10;
const LIGHTNESS_VALUES = { l100: 98, l200: 95, l300: 92, content: 15 };

// Simplified harmony weights - only the best 4 algorithms
const HARMONY_WEIGHTS = {
  golden: 4,              // Golden ratio (most pleasing)
  wildcard: 3,            // Maximum hue distance (high contrast)
  'split-complementary': 3, // Balanced modern look
  analogous: 2            // Safe harmonious option
};

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
   * Generates a hue (0-360) that is at least MIN_HUE_DISTANCE away from any hue in the avoid array.
   */
  static getDistantHue(avoid: number[], maxRetries = MAX_RETRIES): number {
    let attempts = 0;
    let hue = 0;
    while (attempts < maxRetries) {
      hue = Math.random() * 360;
      const isTooClose = avoid.some((h) => {
        const distance = Math.min(Math.abs(hue - h), 360 - Math.abs(hue - h));
        return distance < MIN_HUE_DISTANCE;
      });
      if (!isTooClose) return hue;
      attempts++;
    }
    console.warn(
      `getDistantHue: Reached maxRetries (${maxRetries}). Returning hue ${hue} even though it may be too close.`
    );
    return hue;
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
   * Generates harmonious hues using golden ratio (phi ≈ 1.618) around the color wheel.
   */
  static goldenRatioHarmony(baseHue: number, count = 4): number[] {
    const hues = [baseHue];
    const goldenAngle = 360 * 0.618033988749895; // Golden ratio conjugate (phi - 1)

    for (let i = 1; i < count; i++) {
      const newHue = (baseHue + goldenAngle * i) % 360;
      hues.push(newHue);
    }

    return hues;
  }

  /**
   * Randomly selects a color harmony scheme based on defined weights.
   */
  static getColorHarmony(): string {
    const harmonies = Object.entries(HARMONY_WEIGHTS).map(([name, weight]) => ({ name, weight }));
    const totalWeight = harmonies.reduce((sum, harmony) => sum + harmony.weight, 0);
    let random = Math.random() * totalWeight;

    for (const harmony of harmonies) {
      if (random < harmony.weight) {
        return harmony.name;
      }
      random -= harmony.weight;
    }
    return 'golden'; // Fallback to golden ratio
  }

  /**
   * Generates hues for different theme elements based on the chosen harmony.
   */
  static generateHues(baseHue: number, harmony: string): { base: number; primary: number; secondary: number; accent: number } {
    switch (harmony) {
      case 'analogous':
        return {
          base: baseHue,
          primary: (baseHue + 30) % 360,
          secondary: (baseHue + 60) % 360,
          accent: (baseHue + 90) % 360
        };
      case 'split-complementary':
        return {
          base: baseHue,
          primary: (baseHue + 150) % 360,
          secondary: (baseHue + 210) % 360,
          accent: (baseHue + this.getRandomValue(0, 360)) % 360
        };
      case 'golden': {
        const goldenHues = this.goldenRatioHarmony(baseHue, 4);
        return {
          base: goldenHues[0],
          primary: goldenHues[1],
          secondary: goldenHues[2],
          accent: goldenHues[3]
        };
      }
      case 'wildcard': {
        const hue1 = Math.random() * 360;
        const hue2 = this.getDistantHue([hue1]);
        const hue3 = this.getDistantHue([hue1, hue2]);
        const hue4 = this.getDistantHue([hue1, hue2, hue3]);
        return { base: hue1, primary: hue2, secondary: hue3, accent: hue4 };
      }
      default:
        return { base: baseHue, primary: baseHue, secondary: baseHue, accent: baseHue };
    }
  }

  /**
   * Generates a random color palette based on a random hue and harmony.
   */
  static generateRandomColorPalette() {
    const baseHue = Math.random() * 360;
    const harmony = this.getColorHarmony();
    const hues = this.generateHues(baseHue, harmony);

    // JUICY chroma ranges - pastel punk with FLAVOR
    // Peach fuzz, sunset sherbet, milk tea gold vibes
    const chromaBase = this.getRandomValue(0.08, 0.14);
    const chromaAccent = chromaBase + this.getRandomValue(0.10, 0.18);

    // Base Colors with subtle hue variations
    const baseColors = {
      '--color-base-100': this.generateOKLCHColor(
        LIGHTNESS_VALUES.l100,
        chromaBase * 0.5,
        hues.base
      ),
      '--color-base-200': this.generateOKLCHColor(
        LIGHTNESS_VALUES.l200,
        chromaBase * 0.6,
        (hues.base + 5) % 360
      ),
      '--color-base-300': this.generateOKLCHColor(
        LIGHTNESS_VALUES.l300,
        chromaBase * 0.7,
        (hues.base + 10) % 360
      ),
      '--color-base-content': this.generateOKLCHColor(
        LIGHTNESS_VALUES.content,
        chromaBase * 0.3,
        hues.base
      )
    };

    const primaryColors = {
      '--color-primary': this.generateOKLCHColor(72, chromaAccent * 0.7, hues.primary),
      '--color-primary-content': this.generateOKLCHColor(96, chromaBase * 0.3, hues.primary)
    };

    const secondaryColors = {
      '--color-secondary': this.generateOKLCHColor(75, chromaAccent * 0.6, hues.secondary),
      '--color-secondary-content': this.generateOKLCHColor(96, chromaBase * 0.3, hues.secondary)
    };

    const accentColors = {
      '--color-accent': this.generateOKLCHColor(72, chromaAccent * 0.85, hues.accent),
      '--color-accent-content': this.generateOKLCHColor(96, chromaBase * 0.3, hues.accent)
    };

    const neutralColors = {
      '--color-neutral': this.generateOKLCHColor(70, chromaBase * 0.6, (hues.base + 15) % 360),
      '--color-neutral-content': this.generateOKLCHColor(
        15,
        chromaBase * 0.3,
        (hues.base + 15) % 360
      )
    };

    const semanticColors = {
      '--color-info': this.generateOKLCHColor(85, chromaAccent * 0.9, (hues.base + 210) % 360),
      '--color-info-content': this.generateOKLCHColor(
        95,
        chromaBase * 0.3,
        (hues.base + 210) % 360
      ),
      '--color-success': this.generateOKLCHColor(80, chromaAccent, (hues.base + 120) % 360),
      '--color-success-content': this.generateOKLCHColor(
        95,
        chromaBase * 0.3,
        (hues.base + 120) % 360
      ),
      '--color-warning': this.generateOKLCHColor(90, chromaAccent * 1.1, (hues.base + 40) % 360),
      '--color-warning-content': this.generateOKLCHColor(
        95,
        chromaBase * 0.3,
        (hues.base + 40) % 360
      ),
      '--color-error': this.generateOKLCHColor(75, chromaAccent * 1.2, (hues.base + 0) % 360),
      '--color-error-content': this.generateOKLCHColor(95, chromaBase * 0.3, (hues.base + 0) % 360)
    };

    return {
      harmony, // Include the harmony name for debugging
      ...baseColors,
      ...neutralColors,
      ...primaryColors,
      ...secondaryColors,
      ...accentColors,
      ...semanticColors
    };
  }

  /**
   * Parse OKLCH color string into components.
   */
  static parseOklchColor(oklchColor: string): { lightness: number; chroma: number; hue: number } | null {
    if (!oklchColor) return null;

    const match = oklchColor.match(/oklch\((\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\)/);
    if (!match) return null;

    return {
      lightness: parseFloat(match[1]) / 100, // Convert percentage to 0-1
      chroma: parseFloat(match[2]),
      hue: parseFloat(match[3])
    };
  }

  /**
   * Generates a mesh gradient from an array of colors.
   * Enhanced for more interesting gradients.
   */
  static generateMeshGradient(colors: string[]): string {
    // Add some extra colors for more interesting gradients
    const extendedColors = [...colors];

    // Maybe add an extra color based on the primary color
    if (Math.random() > 0.5 && colors[1]) {
      const parsedColor = this.parseOklchColor(colors[1]);
      if (parsedColor) {
        const newHue = (parsedColor.hue + this.getRandomValue(15, 45)) % 360;
        const newColor = this.generateOKLCHColor(
          Math.min(parsedColor.lightness * 100 + 5, 95),
          parsedColor.chroma * 0.8,
          newHue
        );
        extendedColors.push(newColor);
      }
    }

    return extendedColors
      .map((color, index) => {
        const positionX = this.getRandomValue(10, 90);
        const positionY = this.getRandomValue(10, 90);

        // First color (background) gets larger gradients for better blending
        const stop = index === 0
          ? this.getRandomValue(60, 85)
          : this.getRandomValue(50, 75);

        // Occasionally use elliptical gradients for more interesting shapes
        const isElliptical = Math.random() > 0.7;
        if (isElliptical) {
          const xRadius = this.getRandomValue(70, 130);
          const yRadius = this.getRandomValue(70, 130);
          return `radial-gradient(ellipse ${xRadius}% ${yRadius}% at ${positionX}% ${positionY}%, ${color}, transparent ${stop}%)`;
        }

        return `radial-gradient(circle at ${positionX}% ${positionY}%, ${color}, transparent ${stop}%)`;
      })
      .join(', ');
  }

  /**
   * Applies theme colors to CSS custom properties.
   */
  static applyTheme(theme: Record<string, string>): void {
    if (typeof document === 'undefined') return;

    requestAnimationFrame(() => {
      for (const [key, value] of Object.entries(theme)) {
        if (key.startsWith('--color-') || key === '--gradient-bg') {
          document.documentElement.style.setProperty(key, value);
        }
      }
    });
  }

  /**
   * Generates flavorful but CONSTRAINED gradients
   * Warm triads with MORE personality - still no mud
   */
  static generateSimpleGradient(baseHue: number, secondaryHue: number): string {
    // Warm spectrum: 320-50 (wider range for more variety)
    // Cool spectrum: 140-200 (mint through cyan)

    const isWarm = Math.random() > 0.25; // 75% warm

    let hue1, hue2, hue3;

    if (isWarm) {
      // WARM PALETTE: Peach → Coral → Melon → Gold
      // Range: 320-50 (wrapping)
      const warmBase = 340 + (Math.random() * 50); // 340-390 (wraps to 340-30)
      hue1 = warmBase % 360;
      hue2 = (warmBase + 20) % 360;
      hue3 = (warmBase + 35) % 360;
    } else {
      // COOL PALETTE: Mint → Seafoam → Sky
      // Range: 140-200
      const coolBase = 150 + (Math.random() * 40);
      hue1 = coolBase;
      hue2 = coolBase + 15;
      hue3 = coolBase + 25;
    }

    // Diagonal warmth
    const angle = 125 + (Math.random() * 110); // 125-235

    // Same luminosity (prevents mud) but MORE CHROMA for flavor
    const baseLightness = 93;
    const color1 = this.generateOKLCHColor(baseLightness, this.getRandomValue(0.10, 0.16), hue1);
    const color2 = this.generateOKLCHColor(baseLightness + 2, this.getRandomValue(0.12, 0.18), hue2);
    const color3 = this.generateOKLCHColor(baseLightness + 1, this.getRandomValue(0.10, 0.15), hue3);

    return `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 50%, ${color3} 100%)`;
  }

  /**
   * Generates and applies a complete random theme with clean gradient.
   * Now using simple 2-color linear gradients instead of messy mesh.
   */
  static randomizeTheme(): Record<string, string> {
    // Generate base hue first
    const baseHue = Math.random() * 360;
    const harmony = this.getColorHarmony();
    const hues = this.generateHues(baseHue, harmony);

    const colorPalette = this.generateRandomColorPalette();

    // Apply colors immediately
    this.applyTheme(colorPalette);

    // Generate simple 2-color gradient (deferred for performance)
    requestAnimationFrame(() => {
      // Use base and secondary hues for a very light, calm gradient
      const gradientBg = this.generateSimpleGradient(hues.base, hues.secondary);

      // Update gradient
      document.documentElement.style.setProperty('--gradient-bg', gradientBg);
      colorPalette['--gradient-bg'] = gradientBg;
    });

    return colorPalette;
  }
}
