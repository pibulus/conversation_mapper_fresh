// ===================================================================
// GOLDEN MASTER THEME
// The canonical SoftStack aesthetic - source of truth for all themes
// All randomized themes must orbit around these values
// ===================================================================

/**
 * GOLDEN MASTER - SoftStack Canonical Theme
 *
 * This is the source-of-truth for the SoftStack aesthetic.
 * All randomized themes MUST stay within a narrow neighborhood of these values.
 *
 * RULES:
 * - No pure white (#FFFFFF)
 * - No cold greys (#E0E0E0, #CCCCCC, etc)
 * - No blue, green, teal, or purple as dominant colors
 * - Randomizer may ONLY vary the pink-peach-cream triad within ±10% sat/bright
 * - Shadow geometry NEVER changes
 * - Glow geometry NEVER changes
 * - Layout remains static
 */

// ===================================================================
// CORE COLORS (Non-negotiable tokens)
// ===================================================================

export const GOLDEN_MASTER_COLORS = {
  // Structural neutrals - NEVER randomize these
  '--soft-black': '#1E1714',
  '--soft-brown': '#3A2A22',
  '--soft-cream': '#FFF7EF',
  '--soft-cream-dark': '#FAF3E9',

  // Accent pastels - pink/peach/cream universe (can vary ±10%)
  '--pink-light': '#FFD1E3',
  '--peach-light': '#FFE5D1',
  '--rose-glow': '#FFC4D4',
} as const;

// ===================================================================
// GRADIENT SYSTEM (Background)
// ===================================================================

export const GOLDEN_MASTER_GRADIENT = {
  // Three-stop warm pastel gradient
  // Soft, warm, NO blue or green
  stops: ['#FFE9EF', '#FFEEDC', '#FFF8ED'],
  angle: 135,
  // Grain texture overlay (1-2%)
  grainOpacity: 0.015,
} as const;

// ===================================================================
// SHADOW SYSTEM (Non-negotiable geometry)
// ===================================================================

export const GOLDEN_MASTER_SHADOWS = {
  // Hero slab - heaviest (confident, warm brutalism)
  hero: '0 22px 40px rgba(30, 23, 20, 0.20)',

  // Inner module - medium (sits inside hero)
  module: '0 6px 14px rgba(30, 23, 20, 0.10)',

  // Button - lightest (tool, not star)
  button: '0 3px 8px rgba(30, 23, 20, 0.14)',

  // Paperclip - same as button
  control: '0 3px 8px rgba(30, 23, 20, 0.12)',

  // Everything uses warm darks rgba(30, 23, 20, ...), NOT pure black
} as const;

// ===================================================================
// GLOW SYSTEM (Under the hero card)
// ===================================================================

export const GOLDEN_MASTER_GLOW = {
  // Glow MUST sit under entire hero slab, not button
  blur: 180, // 140-220px range allowed
  spread: 210, // 160-260px range allowed (-16px inset = ~210px effective spread)

  // Radial gradient colors: pink → peach (15-22% opacity)
  colors: [
    { stop: '35%', color: 'rgba(255, 160, 196, 0.32)', radius: '0%' },    // pink-light variant
    { stop: '85%', color: 'rgba(255, 209, 148, 0.28)', radius: '60%' },  // peach-light variant
  ],

  // Position (can vary slightly for randomness)
  positions: [
    { x: [30, 40], y: [0, 5] },     // First glow: top-left area
    { x: [75, 85], y: [80, 90] },   // Second glow: bottom-right area
  ],
} as const;

// ===================================================================
// BORDER SYSTEM (Radii & Weights)
// ===================================================================

export const GOLDEN_MASTER_BORDERS = {
  // Radii
  radii: {
    hero: 26,      // px
    module: 18,    // px (inner capture block)
    input: 12,     // px
    button: 13,    // px
    control: 10,   // px (paperclip, etc)
  },

  // Weights
  weights: {
    hero: 3,       // px
    module: 2,     // px
    button: 2.5,   // px
    control: 2,    // px
  },
} as const;

// ===================================================================
// TYPOGRAPHY (Line-heights, opacities, colors)
// ===================================================================

export const GOLDEN_MASTER_TYPOGRAPHY = {
  eyebrow: {
    color: 'var(--soft-brown)',
    opacity: 0.75,
  },
  headline: {
    color: 'var(--soft-black)',
    opacity: 1,
    lineHeight: 1.1,
  },
  body: {
    color: 'var(--soft-black)',
    opacity: 0.80,
    lineHeight: 1.5,
  },
  caption: {
    color: 'var(--soft-brown)',
    opacity: 0.80,
    lineHeight: 1.55,
  },
  placeholder: {
    // rgba(30, 23, 20, 0.62) = warm brown-grey at 62% opacity
    color: 'rgba(30, 23, 20, 0.62)',
    fontWeight: 500,
  },
} as const;

// ===================================================================
// HOVER LOGIC (Global rules)
// ===================================================================

export const GOLDEN_MASTER_HOVER = {
  // Hover NEVER shifts layout
  // All hovers = small lift + subtle darken + stronger shadow
  lift: -1,          // px (translateY)
  darkenPercent: 3,  // % darker
  shadowBoost: 10,   // % stronger shadow

  // Buttons have subtle pink inner-glow on hover (NOT full card glow)
  buttonGlowColor: 'rgba(255, 92, 141, 0.22)',
} as const;

// ===================================================================
// HUE CONSTRAINTS (Pink-Peach-Cream Triad ONLY)
// ===================================================================

export const SOFTSTACK_HUE_RANGE = {
  // SoftStack universe lives in pink-peach-cream (320° to 40° on color wheel)
  // This wraps around 0° (red)
  min: 320,  // degrees (pink territory starts)
  max: 40,   // degrees (cream/yellow territory ends)

  // FORBIDDEN zones (never allow these hues)
  forbidden: [
    { name: 'blue', min: 180, max: 260 },
    { name: 'green', min: 80, max: 170 },
    { name: 'teal', min: 170, max: 200 },
    { name: 'purple', min: 260, max: 310 },
  ],
} as const;

// ===================================================================
// RANDOMIZER CONSTRAINTS
// ===================================================================

export const RANDOMIZER_CONSTRAINTS = {
  // Saturation (chroma) variance: ±10% of Golden Master
  chromaVariance: 0.10,  // ±10%

  // Brightness (lightness) variance: ±10% of Golden Master
  lightnessVariance: 0.10,  // ±10%

  // Hue must stay within SoftStack range (320-40°)
  hueRange: SOFTSTACK_HUE_RANGE,

  // Golden Master base chroma values (center points for variation)
  baseChroma: 0.10,      // Base backgrounds
  accentChroma: 0.18,    // Accent colors

  // Golden Master lightness values
  baseLightness: 97,     // Very light backgrounds (97%)
  accentLightness: 75,   // Accent colors (75%)
} as const;

// ===================================================================
// HELPER: Check if hue is in SoftStack range
// ===================================================================

export function isHueInSoftStackRange(hue: number): boolean {
  const normalized = ((hue % 360) + 360) % 360;

  // Check if in forbidden zones
  for (const zone of SOFTSTACK_HUE_RANGE.forbidden) {
    if (normalized >= zone.min && normalized <= zone.max) {
      return false;
    }
  }

  // Check if in allowed range (wraps around 0°)
  // 320-360 OR 0-40
  return normalized >= SOFTSTACK_HUE_RANGE.min || normalized <= SOFTSTACK_HUE_RANGE.max;
}

// ===================================================================
// HELPER: Constrain hue to SoftStack range
// ===================================================================

export function constrainHueToSoftStack(hue: number): number {
  const normalized = ((hue % 360) + 360) % 360;

  // If already in range, return it
  if (isHueInSoftStackRange(normalized)) {
    return normalized;
  }

  // Otherwise, snap to nearest allowed boundary
  // If closer to 320, snap to 320-360 range
  // If closer to 40, snap to 0-40 range
  if (normalized > 180) {
    // Closer to 320 side
    return 320 + Math.random() * 40; // 320-360
  } else {
    // Closer to 40 side
    return Math.random() * 40; // 0-40
  }
}

// ===================================================================
// EXPORT DEFAULT THEME (Golden Master as CSS variables)
// ===================================================================

export const GOLDEN_MASTER_THEME = {
  ...GOLDEN_MASTER_COLORS,

  // Gradient
  '--gradient-bg': `linear-gradient(${GOLDEN_MASTER_GRADIENT.angle}deg, ${GOLDEN_MASTER_GRADIENT.stops.join(', ')})`,

  // Module tokens (derived from Golden Master)
  '--module-ink': GOLDEN_MASTER_COLORS['--soft-black'],
  '--module-shell': GOLDEN_MASTER_COLORS['--soft-cream'],
  '--module-wash': GOLDEN_MASTER_COLORS['--soft-cream-dark'],
  '--accent-electric': '#ff5c8d', // Pink accent for electric moments

  // Legacy compatibility (map to new system)
  '--color-base': `linear-gradient(135deg, ${GOLDEN_MASTER_COLORS['--peach-light']} 0%, ${GOLDEN_MASTER_COLORS['--pink-light']} 100%)`,
  '--color-base-solid': GOLDEN_MASTER_COLORS['--peach-light'],
  '--color-secondary': 'rgba(255, 255, 255, 0.6)',
  '--color-accent': GOLDEN_MASTER_COLORS['--rose-glow'],
  '--color-text': GOLDEN_MASTER_COLORS['--soft-black'],
  '--color-text-secondary': GOLDEN_MASTER_COLORS['--soft-brown'],
  '--color-border': 'rgba(30, 23, 20, 0.1)',
} as const;
