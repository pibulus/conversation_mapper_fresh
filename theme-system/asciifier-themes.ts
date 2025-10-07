// 🎨 Asciifier-specific theme configuration
// Two carefully tuned themes: Vintage Cream & Terminal Dusk

import type { Theme, ThemeSystemConfig } from "./mod.ts";
import { RandomThemeGenerator } from "./mod.ts";

// Refined themes for Asciifier
export const vintageCream: Theme = {
  name: "VINTAGE CREAM",
  vibe: "warm nostalgia",
  base: "linear-gradient(135deg, #FDFCF8 0%, #FFF9F3 100%)", // Classy off-white, not pure white
  secondary: "#FFE8CC", // Softer peach, more vintage
  accent: "#FF6B9D", // Slightly softer hot pink
  text: "#2C2825", // Classy charcoal with warm undertones, not pure black
  textSecondary: "#6B5D54", // Warm gray-brown for secondary text
  border: "#2C2825", // Same as text for consistency
  cssVars: {
    "--color-base-solid": "#FDFCF8", // Classy off-white solid
    "--shadow-soft": "rgba(139, 90, 43, 0.1)", // Warm shadow
    "--highlight": "#FFD3B6", // Peachy highlight
  },
};

export const terminalDusk: Theme = {
  name: "TERMINAL DUSK",
  vibe: "midnight hacker",
  base: "#0A0B0F", // Rich blue-black, not pure black
  secondary: "#15171F", // Slightly lighter with blue depth
  accent: "#00FF88", // Classic terminal green with cyan twist
  text: "#00FF88", // Terminal green text
  textSecondary: "#00CC6A", // Darker green for secondary
  border: "#00FF88",
  cssVars: {
    "--color-base-solid": "#0A0B0F",
    "--shadow-glow": "0 0 20px rgba(0, 255, 136, 0.3)", // Terminal glow effect
    "--terminal-amber": "#FFB000", // Alternative terminal color
    "--terminal-blue": "#00B4D8", // Cyan-blue for links
  },
};

// Random theme generator with app-specific constraints
export function generateAsciifierRandomTheme(
  preferLight: boolean = true,
): Theme {
  // Use the preference to determine light/dark
  const isLight = preferLight;

  // Generate a harmonically balanced random theme
  const randomTheme = RandomThemeGenerator.generateHarmonicTheme(
    isLight ? "light" : "dark",
  );

  // Override name and vibe with fun ASCII-themed names
  const asciiVibes = [
    "glitch paradise",
    "pixel dreams",
    "retro terminal",
    "matrix flow",
    "cyber sunset",
    "neon nights",
    "digital dawn",
    "ascii jazz",
    "terminal poetry",
    "code carnival",
    "binary ballet",
    "hex harmony",
  ];

  randomTheme.name = "RANDOM";
  randomTheme.vibe = asciiVibes[Math.floor(Math.random() * asciiVibes.length)];

  // Add some ASCII-specific CSS variables
  randomTheme.cssVars = {
    "--color-base-solid": randomTheme.base.includes("gradient")
      ? randomTheme.base.match(/#[0-9A-Fa-f]{6}/)?.[0] || randomTheme.base
      : randomTheme.base,
    "--shadow-brutal": `4px 4px 0 ${randomTheme.border}`,
  };

  return randomTheme;
}

// Configuration for asciifier-web
export const asciifierThemeConfig: ThemeSystemConfig = {
  themes: [vintageCream, terminalDusk],
  defaultTheme: "VINTAGE CREAM",
  storageKey: "asciifier-theme",
  randomEnabled: true,
  cssPrefix: "--color",
};

// Export individual themes for direct access
export const themes = [vintageCream, terminalDusk];
