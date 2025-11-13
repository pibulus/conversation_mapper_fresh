// ===================================================================
// THEME SHUFFLER ISLAND
// Button to randomize themes with spin animation
// ===================================================================

import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { randomizeTheme, themeSignal } from "../services/themeStore.ts";

export default function ThemeShuffler() {
  const isSpinning = useSignal(false);
  const timeoutRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleShuffle = () => {
    // Clear any existing timeout
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    // Trigger spin animation
    isSpinning.value = true;

    // Randomize theme
    randomizeTheme();

    // Stop spinning after 1 second
    timeoutRef.current = setTimeout(() => {
      isSpinning.value = false;
      timeoutRef.current = null;
    }, 1000) as unknown as number;
  };

  return (
    <button
      onClick={handleShuffle}
      className={`glass glass-hover ${isSpinning.value ? 'animate-spin' : ''}`}
      style={{
        padding: '0.75rem',
        borderRadius: 'var(--border-radius)',
        cursor: 'pointer',
        transition: 'all var(--transition-medium)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: 'var(--text-size)',
        fontWeight: '500',
        color: 'var(--color-text)'
      }}
      title="Randomize Theme"
      aria-label="Randomize theme colors"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
      </svg>
      <span class="hidden sm:inline">Shuffle Theme</span>
      {themeSignal.value.harmony && (
        <span class="hidden md:inline text-xs opacity-70">
          ({themeSignal.value.harmony})
        </span>
      )}
    </button>
  );
}
