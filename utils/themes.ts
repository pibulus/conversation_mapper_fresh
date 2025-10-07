// 🎨 Default Juicy Themes
// Two carefully tuned themes + smart random generation

import type { Theme, ThemeSystemConfig } from "../theme-system/mod.ts";
import { RandomThemeGenerator } from "../theme-system/mod.ts";

// Light theme - Vintage Cream
export const vintageCream: Theme = {
  name: "VINTAGE CREAM",
  vibe: "warm nostalgia",
  base: "linear-gradient(135deg, #FDFCF8 0%, #FFF9F3 100%)",
  secondary: "#FFE8CC",
  accent: "#FF6B9D",
  text: "#2C2825",
  textSecondary: "#6B5D54",
  border: "#2C2825",
  cssVars: {
    "--color-base-solid": "#FDFCF8",
    "--shadow-soft": "rgba(139, 90, 43, 0.1)",
    "--highlight": "#FFD3B6",
  },
};

// Dark theme - Terminal Dusk
export const terminalDusk: Theme = {
  name: "TERMINAL DUSK",
  vibe: "midnight hacker",
  base: "#0A0B0F",
  secondary: "#15171F",
  accent: "#00FF88",
  text: "#00FF88",
  textSecondary: "#00CC6A",
  border: "#00FF88",
  cssVars: {
    "--color-base-solid": "#0A0B0F",
    "--shadow-glow": "0 0 20px rgba(0, 255, 136, 0.3)",
    "--terminal-amber": "#FFB000",
    "--terminal-blue": "#00B4D8",
  },
};

// Random theme generator
export function generateJuicyRandomTheme(preferLight: boolean = true): Theme {
  const isLight = preferLight;
  const randomTheme = RandomThemeGenerator.generateHarmonicTheme(
    isLight ? "light" : "dark",
  );

  // Fun vibes for random themes
  const vibes = [
    "electric dreams",
    "soft rebellion",
    "neon garden",
    "vapor wave",
    "sunset overdrive",
    "digital rain",
    "candy shop",
    "retro future",
    "cosmic dust",
    "pixel party",
    "chrome dreams",
    "pastel punk",
  ];

  randomTheme.name = "RANDOM";
  randomTheme.vibe = vibes[Math.floor(Math.random() * vibes.length)];

  // Add CSS variables
  randomTheme.cssVars = {
    "--color-base-solid": randomTheme.base.includes("gradient")
      ? randomTheme.base.match(/#[0-9A-Fa-f]{6}/)?.[0] || randomTheme.base
      : randomTheme.base,
    "--shadow-brutal": `4px 4px 0 ${randomTheme.border}`,
  };

  return randomTheme;
}

// Default configuration
export const juicyConfig: ThemeSystemConfig = {
  themes: [vintageCream, terminalDusk],
  defaultTheme: "VINTAGE CREAM",
  storageKey: "juicy-theme",
  randomEnabled: true,
  cssPrefix: "--color",
};

// Conversation Mapper theme - Warm peachy gradient
export const conversationMapperTheme: Theme = {
  name: "CONVERSATION MAPPER",
  vibe: "warm peachy goodness",
  base: "linear-gradient(135deg, #FFE5CC 0%, #FFDAB9 50%, #FFE4CC 100%)",
  secondary: "#FFF9F3",
  accent: "#FF6B9D",
  text: "#2C2825",
  textSecondary: "#6B5D54",
  border: "#2C2825",
  cssVars: {
    "--color-base-solid": "#FFE5CC",
    "--shadow-soft": "rgba(139, 90, 43, 0.1)",
    "--shadow-brutal": "4px 4px 0 #2C2825",
    "--highlight": "#FFD3B6",
  },
};

// Export themes array for easy access
export const themes = [conversationMapperTheme, vintageCream, terminalDusk];
