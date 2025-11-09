/**
 * HTML Sanitization Utilities
 *
 * Safe alternatives to dangerouslySetInnerHTML
 * Prevents XSS attacks from untrusted content
 */

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

/**
 * Sanitize and format transcript with speaker highlighting
 * Returns safe HTML string with only allowed tags
 */
export function formatTranscriptSafe(text: string): string {
  if (!text) return '';

  // Escape all HTML first
  const escaped = escapeHtml(text);

  // Convert newlines to <br/>
  let formatted = escaped.replace(/\n/g, '<br/>');

  // Highlight speaker names (safe because content is already escaped)
  formatted = formatted.replace(
    /(Speaker\s*\d+|[A-Z][a-z]+):/g,
    '<span style="font-weight: 600; color: var(--color-accent); margin-right: 0.5rem;">$1:</span>'
  );

  return formatted;
}

/**
 * Sanitize markdown-style text to safe HTML
 * Only allows specific safe transformations
 */
export function formatMarkdownSafe(text: string): string {
  if (!text) return '';

  // Escape HTML first
  let safe = escapeHtml(text);

  // Headers (safe since content is escaped)
  safe = safe
    .replace(/^# (.+)$/gm, '<h3 style="font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; color: var(--color-accent);">$1</h3>')
    .replace(/^## (.+)$/gm, '<h4 style="font-size: 1.1rem; font-weight: 600; margin: 0.75rem 0 0.5rem; color: var(--color-text);">$1</h4>')
    .replace(/^### (.+)$/gm, '<h5 style="font-size: 1rem; font-weight: 600; margin: 0.5rem 0 0.25rem;">$1</h5>');

  // Bold and italic
  safe = safe
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Lists
  safe = safe
    .replace(/^- (.+)$/gm, '<li style="margin-left: 1.5rem; list-style: disc;">$1</li>')
    .replace(/^([0-9]+)\. (.+)$/gm, '<li style="margin-left: 1.5rem; list-style: decimal;">$2</li>');

  // Paragraphs
  safe = safe.replace(/\n\n/g, '</p><p style="margin: 0.75rem 0;">');

  return `<div style="line-height: 1.7;"><p style="margin: 0.75rem 0;">${safe}</p></div>`;
}
