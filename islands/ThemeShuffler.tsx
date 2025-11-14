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
        padding: '0.625rem',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all var(--transition-medium)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.25rem',
        opacity: 0.5
      }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
      title="Shuffle colors"
      aria-label="Randomize theme colors"
    >
      ✨
    </button>
  );
}
