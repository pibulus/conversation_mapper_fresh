// 🎨 Conversation Mapper Themes
// Clean pastel themes matching the original Svelte design

import type { Theme, ThemeSystemConfig } from "../theme-system/mod.ts";

// ===================================================================
// CORE THEMES - Clean pastel aesthetics
// ===================================================================

// Peachy Cream (default) - Warm peachy gradient
export const peachyCream: Theme = {
  name: "PEACHY",
  vibe: "warm & welcoming",
  base: "linear-gradient(135deg, #FFEBD4 0%, #FFD9B8 100%)",
  secondary: "rgba(255, 255, 255, 0.6)",
  accent: "#E8839C",
  text: "#3D3935",
  textSecondary: "#8B7F77",
  border: "rgba(61, 57, 53, 0.1)",
  cssVars: {
    "--color-base-solid": "#FFEBD4",
    "--shadow-soft": "0 4px 12px rgba(0, 0, 0, 0.08)",
    "--gradient-bg": "linear-gradient(to bottom right, #FFE5D4, #FF9A76)",
  },
};

// Lavender Dream - Soft purple gradient
export const lavenderDream: Theme = {
  name: "LAVENDER",
  vibe: "calm & creative",
  base: "linear-gradient(135deg, #EFE5F7 0%, #DBC9ED 100%)",
  secondary: "rgba(255, 255, 255, 0.6)",
  accent: "#9B7EC7",
  text: "#3D3A42",
  textSecondary: "#8B8390",
  border: "rgba(61, 58, 66, 0.1)",
  cssVars: {
    "--color-base-solid": "#EFE5F7",
    "--shadow-soft": "0 4px 12px rgba(155, 126, 199, 0.12)",
    "--gradient-bg": "linear-gradient(to bottom right, #E8D5F2, #B591D9)",
  },
};

// Sky Blue - Fresh blue gradient (matches Svelte screenshot)
export const skyBlue: Theme = {
  name: "SKY",
  vibe: "fresh & clear",
  base: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
  secondary: "rgba(255, 255, 255, 0.6)",
  accent: "#5C9DD5",
  text: "#2C3E50",
  textSecondary: "#7A8C9E",
  border: "rgba(44, 62, 80, 0.1)",
  cssVars: {
    "--color-base-solid": "#E3F2FD",
    "--shadow-soft": "0 4px 12px rgba(92, 157, 213, 0.12)",
    "--gradient-bg": "linear-gradient(to bottom right, #97abff, #123597)",
  },
};

// Mint Fresh - Soft green gradient
export const mintFresh: Theme = {
  name: "MINT",
  vibe: "energizing & balanced",
  base: "linear-gradient(135deg, #E8F8F5 0%, #CDEEE8 100%)",
  secondary: "rgba(255, 255, 255, 0.6)",
  accent: "#5DBEAA",
  text: "#2C4A42",
  textSecondary: "#7A9690",
  border: "rgba(44, 74, 66, 0.1)",
  cssVars: {
    "--color-base-solid": "#E8F8F5",
    "--shadow-soft": "0 4px 12px rgba(93, 190, 170, 0.12)",
    "--gradient-bg": "linear-gradient(to bottom right, #D4F5ED, #3EBEAA)",
  },
};

// Sunset Pink - Warm pink gradient (matches Svelte screenshot)
export const sunsetPink: Theme = {
  name: "SUNSET",
  vibe: "playful & energetic",
  base: "linear-gradient(135deg, #FFE6F0 0%, #FFCCE0 100%)",
  secondary: "rgba(255, 255, 255, 0.6)",
  accent: "#E85D8F",
  text: "#3D2A35",
  textSecondary: "#8B7580",
  border: "rgba(61, 42, 53, 0.1)",
  cssVars: {
    "--color-base-solid": "#FFE6F0",
    "--shadow-soft": "0 4px 12px rgba(232, 93, 143, 0.12)",
    "--gradient-bg": "linear-gradient(to bottom right, #FFC2D4, #9D50BB)",
  },
};

// ===================================================================
// THEME CONFIGURATION
// ===================================================================

export const themes = [
  peachyCream,
  lavenderDream,
  skyBlue,
  mintFresh,
  sunsetPink,
];

export const juicyConfig: ThemeSystemConfig = {
  themes: themes,
  defaultTheme: "PEACHY",
  storageKey: "conversation-mapper-theme",
  randomEnabled: false, // Disabled - we have curated themes
  cssPrefix: "--color",
};
