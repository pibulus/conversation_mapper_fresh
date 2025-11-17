/**
 * Toast Notification Utility
 *
 * Provides user feedback for actions like copy, save, errors
 * Ported from SvelteKit version with improvements
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

/**
 * Shows a toast notification with icon and styling
 */
export function showToast(
  message: string,
  type: ToastType = 'success',
  duration: number = 3000
): HTMLElement | null {
  if (typeof window === 'undefined') return null;

  // Create toast container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.25rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 0.9375rem;
    font-weight: 500;
    max-width: 350px;
    pointer-events: auto;
    animation: slideInRight 0.3s ease-out;
    backdrop-filter: blur(10px);
  `;

  // Icon and color mapping
  const config = {
    success: {
      emoji: '✓',
      bg: 'oklch(0.75 0.1 145)',
      color: 'oklch(0.25 0.03 145)'
    },
    error: {
      emoji: '⚠',
      bg: 'oklch(0.75 0.15 25)',
      color: 'oklch(0.25 0.03 25)'
    },
    info: {
      emoji: 'ℹ',
      bg: 'oklch(0.75 0.1 240)',
      color: 'oklch(0.25 0.03 240)'
    },
    warning: {
      emoji: '⚡',
      bg: 'oklch(0.80 0.15 80)',
      color: 'oklch(0.25 0.03 80)'
    }
  };

  const { emoji, bg, color } = config[type];

  toast.style.backgroundColor = bg;
  toast.style.color = color;

  toast.innerHTML = `
    <span style="font-size: 1.25rem;">${emoji}</span>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  // Auto-remove after duration
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
      toast.remove();
      // Remove container if empty
      if (container && container.children.length === 0) {
        container.remove();
      }
    }, 300);
  }, duration);

  return toast;
}

/**
 * Escape HTML to prevent XSS in toast messages
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Copies text to clipboard with toast feedback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text?.trim()) {
    console.warn('No content to copy to clipboard');
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
    return true;
  } catch (err) {
    console.error('Error copying to clipboard:', err);
    showToast('Failed to copy to clipboard', 'error');
    return false;
  }
}

/**
 * Format a date with standard options
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };

  const dateObj = date instanceof Date ? date : new Date(date);

  try {
    return dateObj.toLocaleString('en-US', { ...defaultOptions, ...options });
  } catch (err) {
    console.error('Error formatting date:', err);
    return 'Unknown date';
  }
}
