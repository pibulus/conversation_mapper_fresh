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
      style={{
        padding: '0.65rem 0.75rem',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        /* Refined pill style - matches design system, not debug toggle */
        background: 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1.5px solid rgba(30, 23, 20, 0.12)', /* use soft-black tint */
        boxShadow: '0 2px 6px rgba(30, 23, 20, 0.06)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)';
        e.currentTarget.style.borderColor = 'rgba(30, 23, 20, 0.18)';
        e.currentTarget.style.transform = 'scale(1.04)';
        e.currentTarget.style.boxShadow = '0 4px 10px rgba(30, 23, 20, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.65)';
        e.currentTarget.style.borderColor = 'rgba(30, 23, 20, 0.12)';
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 2px 6px rgba(30, 23, 20, 0.06)';
      }}
      title="Shuffle theme colors"
      aria-label="Randomize theme colors"
    >
      {/* Palette icon that spins on click */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transition: 'transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          transform: isSpinning.value ? 'rotate(360deg)' : 'rotate(0deg)',
          color: 'var(--soft-black)', /* use unified color token */
          opacity: 0.85
        }}
      >
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
      </svg>
    </button>
  );
}
