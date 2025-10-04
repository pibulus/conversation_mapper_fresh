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

  const toast = document.createElement('div');
  toast.className = 'toast toast-bottom toast-end z-[9999]';

  // Icon and color mapping
  const config = {
    success: {
      icon: 'fa-check-circle',
      bg: 'bg-success',
      text: 'text-success-content'
    },
    error: {
      icon: 'fa-exclamation-circle',
      bg: 'bg-error',
      text: 'text-error-content'
    },
    info: {
      icon: 'fa-info-circle',
      bg: 'bg-info',
      text: 'text-info-content'
    },
    warning: {
      icon: 'fa-exclamation-triangle',
      bg: 'bg-warning',
      text: 'text-warning-content'
    }
  };

  const { icon, bg, text } = config[type];

  toast.innerHTML = `
    <div class="alert ${bg} ${text} shadow-lg animate-slide-in-right">
      <div class="flex items-center gap-2">
        <i class="fas ${icon}"></i>
        <span>${message}</span>
      </div>
    </div>`;

  document.body.appendChild(toast);

  // Auto-remove after duration
  setTimeout(() => {
    toast.classList.add('animate-slide-out-right');
    setTimeout(() => toast.remove(), 300);
  }, duration);

  return toast;
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
