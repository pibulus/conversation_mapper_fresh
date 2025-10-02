import { type Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Soft Neo Toybrut Palette
        "paper": "#FAF9F6",
        "peach": "#FFE5B4",
        "hot-pink": "#FF69B4",
        "terminal-green": "#00FF41",
        "amber": "#FFB000",
        "soft-black": "#0A0A0A",
        "soft-purple": "#9370DB",
        "soft-blue": "#87CEEB",
        "soft-yellow": "#F9E79F",
        "soft-mint": "#98FB98",
      },
      fontFamily: {
        "mono": ["JetBrains Mono", "Courier New", "monospace"],
        "sans": ["-apple-system", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "brutal": "4px 4px 0px 0px #000",
        "brutal-sm": "2px 2px 0px 0px #000",
        "brutal-lg": "6px 6px 0px 0px #000",
      },
    },
  },
  plugins: [],
} satisfies Config;
