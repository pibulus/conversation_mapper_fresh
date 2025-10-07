import { useEffect, useRef, useState } from "preact/hooks";
import { createThemeSystem, type Theme } from "../theme-system/mod.ts";
import { themes } from "../utils/themes.ts";

export interface JuicyThemesProps {
  /** Custom themes to use instead of defaults */
  themes?: Theme[];
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
  storageKey = "conversation-mapper-theme",
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
      randomEnabled: false,
      cssPrefix: "--color",
    })
  );
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

    return unsubscribe;
  }, []);

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

  return (
    <div class="juicy-themes-widget relative" ref={dropdownRef}>
      {/* Theme Toggle Button */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        class="juicy-themes-button px-3 py-2 rounded-lg font-semibold text-sm transition-all hover:brightness-110 active:scale-95"
        style={{
          backgroundColor: 'var(--color-accent)',
          color: 'white',
          border: '2px solid var(--color-border)',
          boxShadow: 'var(--shadow-soft)'
        }}
        title={`Current theme: ${currentTheme.name} - ${currentTheme.vibe}`}
      >
        <span class="mr-1.5">🎨</span>
        {buttonText || currentTheme.name}
      </button>

      {/* Theme Picker Dropdown */}
      {showPicker && (
        <div
          class={`juicy-themes-dropdown absolute top-full mt-2 rounded-xl overflow-hidden z-50 ${
            position === "left" ? "left-0" : "right-0"
          }`}
          style={{
            backgroundColor: 'white',
            border: '2px solid var(--color-border)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            width: '220px'
          }}
        >
          <div class="p-3">
            {/* Theme Options */}
            <div class="space-y-2">
              {themeList.map((theme) => (
                <button
                  type="button"
                  key={theme.name}
                  onClick={() => handleThemeChange(theme)}
                  class="w-full px-4 py-3 rounded-lg text-sm font-semibold hover:scale-[1.02] transition-all relative"
                  style={{
                    background: theme.base,
                    color: theme.text,
                    border: `2px solid ${theme.border}`,
                    boxShadow: currentTheme.name === theme.name
                      ? `0 0 0 2px ${theme.accent} inset`
                      : 'none'
                  }}
                >
                  <div class="flex items-center justify-between">
                    <div class="text-left">
                      <div class="font-bold">{theme.name}</div>
                      <div class="text-xs opacity-60">{theme.vibe}</div>
                    </div>
                    {currentTheme.name === theme.name && (
                      <span class="text-lg">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
