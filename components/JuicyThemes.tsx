import { useEffect, useRef, useState } from "preact/hooks";
import { createThemeSystem, type Theme } from "../theme-system/mod.ts";
import { generateJuicyRandomTheme, themes } from "../utils/themes.ts";

export interface JuicyThemesProps {
  /** Custom themes to use instead of defaults */
  themes?: Theme[];
  /** Whether to show the random button */
  showRandom?: boolean;
  /** Whether to show vintage controls (grain/scan) */
  showVintageControls?: boolean;
  /** Custom storage key for localStorage */
  storageKey?: string;
  /** Callback when theme changes */
  onThemeChange?: (theme: Theme) => void;
  /** Custom button text (instead of theme name) */
  buttonText?: string;
  /** Position of dropdown */
  position?: "left" | "right";
}

export default function JuicyThemes({
  themes: customThemes,
  showRandom = true,
  showVintageControls = true,
  storageKey = "juicy-theme",
  onThemeChange,
  buttonText,
  position = "right",
}: JuicyThemesProps = {}) {
  const themeList = customThemes || themes;
  const [currentTheme, setCurrentTheme] = useState<Theme>(themeList[0]);
  const [showPicker, setShowPicker] = useState(false);
  const [themeSystem] = useState(() =>
    createThemeSystem({
      themes: themeList,
      defaultTheme: themeList[0].name,
      storageKey,
      randomEnabled: showRandom,
      cssPrefix: "--color",
    })
  );
  const [grainLevel, setGrainLevel] = useState(0.08);
  const [scanLevel, setScanLevel] = useState(0.03);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize theme system and load saved theme
    const theme = themeSystem.init();
    setCurrentTheme(theme);

    // Subscribe to theme changes
    const unsubscribe = themeSystem.subscribe((theme) => {
      setCurrentTheme(theme);
      onThemeChange?.(theme);
    });

    // Load saved vintage settings
    if (showVintageControls) {
      const savedGrain = localStorage.getItem(`${storageKey}-grain`);
      const savedScan = localStorage.getItem(`${storageKey}-scan`);
      if (savedGrain) setGrainLevel(parseFloat(savedGrain));
      if (savedScan) setScanLevel(parseFloat(savedScan));
    }

    return unsubscribe;
  }, []);

  // Update vintage effects when sliders change
  useEffect(() => {
    if (!showVintageControls) return;

    // Update the grain layer
    const grainLayer = document.getElementById("grain-layer");
    if (grainLayer) {
      (grainLayer as HTMLElement).style.opacity = grainLevel.toString();
    }
    // Update the scanline layer
    const scanLayer = document.getElementById("scan-layer");
    if (scanLayer) {
      (scanLayer as HTMLElement).style.opacity = scanLevel.toString();

      // Smart scanline inversion based on theme darkness
      const isDark = currentTheme.base.includes("#0") ||
        currentTheme.base.includes("#1") ||
        currentTheme.base.includes("#2") ||
        currentTheme.name.toLowerCase().includes("dark") ||
        currentTheme.name.toLowerCase().includes("terminal");

      const scanColor = isDark ? "255, 255, 255" : "0, 0, 0";
      (scanLayer as HTMLElement).style.background = `repeating-linear-gradient(
        0deg,
        rgba(${scanColor}, 0.2),
        rgba(${scanColor}, 0.2) 3px,
        transparent 3px,
        transparent 6px
      )`;
    }
    // Save settings
    localStorage.setItem(`${storageKey}-grain`, grainLevel.toString());
    localStorage.setItem(`${storageKey}-scan`, scanLevel.toString());
  }, [grainLevel, scanLevel, currentTheme, showVintageControls]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showPicker]);

  const handleThemeChange = (theme: Theme) => {
    themeSystem.setTheme(theme.name);
    setShowPicker(false);
  };

  const generateRandomTheme = () => {
    // Determine if current theme is light or dark
    let isLight = true;

    if (currentTheme.name === "VINTAGE CREAM") {
      isLight = true;
    } else if (currentTheme.name === "TERMINAL DUSK") {
      isLight = false;
    } else if (currentTheme.name === "RANDOM") {
      // For random themes, check if the base color is light or dark
      const baseColor = currentTheme.base.includes("gradient")
        ? currentTheme.base.match(/#[0-9A-Fa-f]{6}/)?.[0] || currentTheme.base
        : currentTheme.base;

      // Check the hex value - if it starts with 0, 1, 2, 3, 4, 5 it's dark
      const firstChar = baseColor[1]?.toUpperCase();
      isLight = !['0', '1', '2', '3', '4', '5'].includes(firstChar);
    }

    const randomTheme = generateJuicyRandomTheme(isLight);
    themeSystem.applyTheme(randomTheme);
    setCurrentTheme(randomTheme);
  };

  return (
    <div class="juicy-themes-widget relative" ref={dropdownRef}>
      {/* Theme Toggle Button */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        class="juicy-themes-button group relative px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all hover:scale-105 active:scale-95"
        style="background-color: var(--color-accent); color: var(--color-base); border: 2px solid var(--color-border); box-shadow: 4px 4px 0 var(--color-border)"
        title="Change theme"
      >
        <span class="mr-2">🎨</span>
        {buttonText || currentTheme.name.split(" ")[0]}
        <span class="ml-2 opacity-60">↓</span>
      </button>

      {/* Theme Picker Dropdown */}
      {showPicker && (
        <div
          class={`juicy-themes-dropdown absolute top-full mt-2 w-56 rounded-xl overflow-hidden z-50 ${
            position === "left" ? "left-0" : "right-0"
          }`}
          style="background-color: var(--color-base); border: 3px solid var(--color-border); box-shadow: 6px 6px 0 rgba(0,0,0,0.2)"
        >
          <div class="p-4 font-mono">
            {/* Theme Options */}
            <div class="space-y-3">
              {themeList.map((theme) => (
                <button
                  type="button"
                  key={theme.name}
                  onClick={() => handleThemeChange(theme)}
                  class="w-full text-center px-4 py-3 rounded-lg text-sm font-mono hover:scale-[1.02] transition-all"
                  style={`
                    background-color: ${theme.secondary};
                    color: ${theme.text};
                    border: 3px solid ${theme.border};
                    ${
                    currentTheme.name === theme.name
                      ? `box-shadow: 0 0 0 2px ${theme.accent} inset`
                      : ""
                  }
                  `}
                >
                  <div class="flex items-center justify-center relative">
                    <span class="font-black tracking-wider uppercase">
                      {theme.name.split(" ")[0]}
                    </span>
                    {currentTheme.name === theme.name && (
                      <span class="absolute right-0 text-lg">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Random Button */}
            {showRandom && (
              <>
                <div
                  class="my-3 border-t-2 opacity-20"
                  style="border-color: var(--color-border)"
                >
                </div>
                <button
                  type="button"
                  onClick={generateRandomTheme}
                  class="w-full px-3 py-1.5 rounded-lg text-xs font-mono hover:scale-[1.02] transition-all"
                  style="background: linear-gradient(90deg, #FFE8CC 0%, #FFD3B6 50%, #FFBFA0 100%); color: #2C2825; border: 2px solid #2C2825;"
                >
                  <span class="flex items-center justify-center gap-1.5 font-bold tracking-wide">
                    <span>🎲</span>
                    <span class="uppercase">random</span>
                  </span>
                </button>
              </>
            )}

            {/* Vintage Controls */}
            {showVintageControls && (
              <>
                <div
                  class="my-3 border-t-2 opacity-20"
                  style="border-color: var(--color-border)"
                >
                </div>
                <div class="space-y-3">
                  {/* Grain Slider */}
                  <div>
                    <label
                      class="flex items-center justify-between text-xs font-mono mb-1"
                      style="color: var(--color-text)"
                    >
                      <span class="uppercase font-bold">Grain</span>
                      <span class="opacity-60">
                        {Math.round(grainLevel * 100)}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="0.5"
                      step="0.01"
                      value={grainLevel}
                      onInput={(e) =>
                        setGrainLevel(
                          parseFloat((e.target as HTMLInputElement).value),
                        )}
                      class="juicy-slider w-full h-2 rounded-full outline-none cursor-pointer"
                      style={`
                        background: linear-gradient(to right,
                          var(--color-accent) 0%,
                          var(--color-accent) ${(grainLevel / 0.5) * 100}%,
                          var(--color-secondary) ${(grainLevel / 0.5) * 100}%,
                          var(--color-secondary) 100%);
                        -webkit-appearance: none;
                      `}
                    />
                  </div>

                  {/* Scan Slider */}
                  <div>
                    <label
                      class="flex items-center justify-between text-xs font-mono mb-1"
                      style="color: var(--color-text)"
                    >
                      <span class="uppercase font-bold">Scan</span>
                      <span class="opacity-60">
                        {Math.round(scanLevel * 100)}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="0.2"
                      step="0.01"
                      value={scanLevel}
                      onInput={(e) =>
                        setScanLevel(
                          parseFloat((e.target as HTMLInputElement).value),
                        )}
                      class="juicy-slider w-full h-2 rounded-full outline-none cursor-pointer"
                      style={`
                        background: linear-gradient(to right,
                          var(--color-accent) 0%,
                          var(--color-accent) ${(scanLevel / 0.2) * 100}%,
                          var(--color-secondary) ${(scanLevel / 0.2) * 100}%,
                          var(--color-secondary) 100%);
                        -webkit-appearance: none;
                      `}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
