/**
 * MarkdownMaker Drawer Island
 *
 * Right-hand slide-in drawer for converting conversations to different formats
 * Ported from Svelte conversation_mapper version with full functionality
 */

import { signal } from "@preact/signals";
import { useEffect, useRef, useState } from "preact/hooks";
import { markdownPrompts } from "../utils/markdownPrompts.ts";
import { geminiService } from "../utils/geminiService.ts";
import { showToast } from "../utils/toast.ts";

interface MarkdownMakerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transcript: string;
  conversationId: string;
}

interface SavedOutput {
  id: string;
  conversation_id: string;
  content: string;
  prompt: string;
  created_at: string;
}

const selectedPromptId = signal<string | null>(null);
const customPrompt = signal("");
const markdown = signal("");
const loading = signal(false);
const error = signal<string | null>(null);
const savedOutputs = signal<SavedOutput[]>([]);

export default function MarkdownMakerDrawer({ isOpen, onClose, transcript, conversationId }: MarkdownMakerDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Load saved outputs from localStorage
  useEffect(() => {
    if (isOpen && conversationId) {
      loadSavedOutputs();
    }
  }, [isOpen, conversationId]);

  // Handle smooth animation
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready
      setTimeout(() => setIsAnimating(true), 50);
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before unmounting
      const timeout = setTimeout(() => setShouldRender(false), 450);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    // Add small delay to prevent immediate close
    const timeout = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Load saved outputs from localStorage
  function loadSavedOutputs() {
    try {
      const stored = localStorage.getItem('markdown_outputs');
      if (stored) {
        const allOutputs: SavedOutput[] = JSON.parse(stored);
        savedOutputs.value = allOutputs.filter(o => o.conversation_id === conversationId);
      }
    } catch (err) {
      console.error('Error loading saved outputs:', err);
    }
  }

  // Save output to localStorage
  function saveOutput() {
    if (!markdown.value || !conversationId) return;

    try {
      const newOutput: SavedOutput = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        content: markdown.value,
        prompt: selectedPromptId.value
          ? markdownPrompts.find(p => p.id === selectedPromptId.value)?.label || 'Custom'
          : 'Custom',
        created_at: new Date().toISOString()
      };

      // Get all outputs, add new one, save back
      const stored = localStorage.getItem('markdown_outputs');
      const allOutputs: SavedOutput[] = stored ? JSON.parse(stored) : [];
      allOutputs.push(newOutput);
      localStorage.setItem('markdown_outputs', JSON.stringify(allOutputs));

      // Update signal
      savedOutputs.value = allOutputs.filter(o => o.conversation_id === conversationId);
      showToast('Output saved!', 'success');
    } catch (err) {
      console.error('Error saving output:', err);
      showToast('Failed to save output', 'error');
    }
  }

  // Delete saved output
  function deleteOutput(id: string) {
    try {
      const stored = localStorage.getItem('markdown_outputs');
      if (stored) {
        const allOutputs: SavedOutput[] = JSON.parse(stored);
        const filtered = allOutputs.filter(o => o.id !== id);
        localStorage.setItem('markdown_outputs', JSON.stringify(filtered));
        savedOutputs.value = filtered.filter(o => o.conversation_id === conversationId);
        showToast('Output deleted', 'success');
      }
    } catch (err) {
      console.error('Error deleting output:', err);
      showToast('Failed to delete output', 'error');
    }
  }

  // Generate markdown from preset prompt
  async function generateFromPreset(promptId: string) {
    const promptOption = markdownPrompts.find(p => p.id === promptId);
    if (!promptOption || !transcript.trim()) {
      error.value = 'No transcript content available';
      showToast('No transcript content available', 'error');
      return;
    }

    loading.value = true;
    error.value = null;
    selectedPromptId.value = promptId;

    try {
      const result = await geminiService.generateMarkdown(promptOption.prompt, transcript);
      markdown.value = result;
      showToast('Markdown generated!', 'success');
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Generation failed';
      showToast(err instanceof Error ? err.message : 'Failed to generate markdown', 'error');
      markdown.value = '';
    } finally {
      loading.value = false;
    }
  }

  // Generate markdown from custom prompt
  async function generateFromCustom() {
    if (!customPrompt.value.trim() || !transcript.trim()) {
      error.value = 'Please provide both a prompt and transcript';
      showToast('Please provide both a prompt and transcript', 'warning');
      return;
    }

    loading.value = true;
    error.value = null;
    selectedPromptId.value = null;

    try {
      const result = await geminiService.generateMarkdown(customPrompt.value, transcript);
      markdown.value = result;
      showToast('Markdown generated!', 'success');
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Generation failed';
      showToast(err instanceof Error ? err.message : 'Failed to generate markdown', 'error');
      markdown.value = '';
    } finally {
      loading.value = false;
    }
  }

  // Copy to clipboard
  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(markdown.value);
      showToast('Copied to clipboard!', 'success');
    } catch (err) {
      showToast('Failed to copy', 'error');
    }
  }

  // Copy saved output
  async function copySavedOutput(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      showToast('Copied to clipboard!', 'success');
    } catch (err) {
      showToast('Failed to copy', 'error');
    }
  }

  // Download as markdown file
  function downloadMarkdown() {
    if (!markdown.value) return;

    try {
      const blob = new Blob([markdown.value], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Generate filename from prompt type and timestamp
      const promptLabel = selectedPromptId.value
        ? markdownPrompts.find(p => p.id === selectedPromptId.value)?.label || 'Export'
        : 'CustomExport';
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      a.download = `${promptLabel}-${timestamp}.md`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Downloaded as markdown!', 'success');
    } catch (err) {
      showToast('Failed to download', 'error');
    }
  }

  // Download as PDF using browser print
  function downloadPDF() {
    if (!markdown.value) return;

    try {
      // Create a hidden print window with styled content
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showToast('Please allow popups to download PDF', 'warning');
        return;
      }

      const promptLabel = selectedPromptId.value
        ? markdownPrompts.find(p => p.id === selectedPromptId.value)?.label || 'Export'
        : 'Custom Export';

      // Convert markdown line breaks to HTML
      const htmlContent = markdown.value
        .split('\n\n')
        .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
        .join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${promptLabel}</title>
            <style>
              @media print {
                @page {
                  margin: 0.75in;
                  size: letter;
                }
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 8.5in;
                margin: 0 auto;
                padding: 1rem;
              }
              h1, h2, h3 {
                color: #7c3aed;
                margin-top: 1.5em;
              }
              h1 { font-size: 24pt; border-bottom: 2px solid #7c3aed; padding-bottom: 0.3em; }
              h2 { font-size: 18pt; }
              h3 { font-size: 14pt; }
              p {
                margin: 0.8em 0;
                text-align: justify;
              }
              code, pre {
                background: #f3f4f6;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
              }
              pre {
                padding: 1em;
                overflow-x: auto;
              }
              ul, ol {
                margin: 0.5em 0;
                padding-left: 2em;
              }
              li {
                margin: 0.3em 0;
              }
              .header {
                text-align: center;
                margin-bottom: 2em;
                padding-bottom: 1em;
                border-bottom: 3px solid #7c3aed;
              }
              .footer {
                margin-top: 3em;
                padding-top: 1em;
                border-top: 1px solid #e5e7eb;
                font-size: 9pt;
                color: #6b7280;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${promptLabel}</h1>
              <p style="color: #6b7280; font-size: 11pt;">Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            <div style="white-space: pre-wrap; font-family: monospace;">${markdown.value}</div>
            <div class="footer">
              Generated by Conversation Mapper
            </div>
          </body>
        </html>
      `);

      printWindow.document.close();

      // Wait for content to load then trigger print
      setTimeout(() => {
        printWindow.print();
        // Don't close immediately - let user save PDF first
        showToast('Opening print dialog for PDF...', 'success');
      }, 250);
    } catch (err) {
      showToast('Failed to generate PDF', 'error');
    }
  }

  if (!shouldRender) return null;

  return (
    <>
      {/* Drawer with smooth Svelte-style animation */}
      <div
        ref={drawerRef}
        class={`fixed bottom-0 right-0 top-0 z-50 flex w-96 flex-col overflow-hidden transition-transform duration-[400ms] ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          borderLeft: `var(--border-width) solid var(--color-border)`,
          background: 'var(--color-secondary)',
          boxShadow: 'var(--shadow-lifted)',
          transitionTimingFunction: isAnimating
            ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' // bounce in
            : 'cubic-bezier(0.4, 0, 1, 1)' // slide out
        }}
      >
        {/* Header */}
        <div class="dashboard-card-header">
          <h3>Export</h3>
          <button
            onClick={onClose}
            class="text-white icon-btn"
            title="Close"
            aria-label="Close export"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div class="flex-1 overflow-y-auto" style={{ padding: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
          {/* Section: Quick Prompts */}
          <section style={{ marginBottom: 'clamp(1.5rem, 4vw, 2rem)' }}>
            <h4 style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-text)',
              marginBottom: '0.875rem'
            }}>
              Quick Prompts
            </h4>
            <div class="flex flex-wrap gap-3">
              {markdownPrompts.map((promptOption) => (
                <button
                  key={promptOption.id}
                  class={`btn flex-1 min-w-full ${
                    selectedPromptId.value === promptOption.id
                      ? 'btn-primary'
                      : ''
                  }`}
                  style={{
                    minHeight: '2.75rem',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '600'
                  }}
                  onClick={() => generateFromPreset(promptOption.id)}
                  disabled={loading.value}
                >
                  {promptOption.label}
                </button>
              ))}
            </div>
          </section>

          {/* Section: Custom Prompt */}
          <section style={{ marginBottom: 'clamp(1.5rem, 4vw, 2rem)' }}>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-text)',
              marginBottom: '0.875rem'
            }}>
              Custom Prompt
            </label>
            <textarea
              class="w-full rounded focus:outline-none"
              style={{
                minHeight: '6rem',
                padding: '0.875rem 1rem',
                fontSize: 'var(--font-size-sm)',
                lineHeight: '1.6',
                border: '2px solid var(--color-border)',
                background: 'var(--surface-cream)',
                transition: 'border-color var(--transition-fast)',
                resize: 'vertical'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              placeholder="Type your own custom prompt here..."
              value={customPrompt.value}
              onInput={(e) => customPrompt.value = (e.target as HTMLTextAreaElement).value}
            />

            {/* Generate Custom Button */}
            <button
              class="btn btn-primary w-full"
              style={{
                marginTop: '1rem',
                minHeight: '2.75rem',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600'
              }}
              onClick={generateFromCustom}
              disabled={loading.value || !customPrompt.value.trim() || !transcript.trim()}
            >
              {loading.value && selectedPromptId.value === null ? (
                <span class="loading loading-spinner loading-sm"></span>
              ) : null}
              Generate Custom
            </button>
          </section>

          {/* Loading Indicator for Preset Buttons */}
          {loading.value && selectedPromptId.value !== null && (
            <section class="flex justify-center" style={{ marginBottom: 'clamp(1.5rem, 4vw, 2rem)' }}>
              <span class="loading loading-spinner loading-lg" style={{ color: 'var(--color-accent)' }}></span>
            </section>
          )}

          {/* Error Display */}
          {error.value && (
            <section class="alert alert-error" style={{
              marginBottom: 'clamp(1.5rem, 4vw, 2rem)',
              padding: '1rem',
              fontSize: 'var(--font-size-sm)'
            }}>
              <span>{error.value}</span>
            </section>
          )}

          {/* Section: Markdown Preview */}
          {markdown.value && (
            <section style={{ marginBottom: 'clamp(1.5rem, 4vw, 2rem)' }}>
              <div class="rounded-lg overflow-hidden" style={{
              border: '4px solid var(--color-accent)',
              boxShadow: 'var(--shadow-slab)'
            }}>
              <div style={{
                padding: '0.875rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--color-accent)',
                borderBottom: '4px solid var(--soft-black)'
              }}>
                <span style={{
                  fontWeight: '700',
                  fontSize: 'var(--font-size-sm)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'white'
                }}>
                  Preview
                </span>
                <div class="flex gap-3">
                  <button
                    class="text-white icon-btn"
                    style={{
                      padding: '0.25rem',
                      fontSize: 'var(--font-size-base)'
                    }}
                    onClick={copyToClipboard}
                    title="Copy to clipboard"
                  >
                    <i class="fa fa-copy"></i>
                  </button>
                  <button
                    class="text-white icon-btn"
                    style={{
                      padding: '0.25rem',
                      fontSize: 'var(--font-size-base)'
                    }}
                    onClick={downloadMarkdown}
                    title="Download as .md file"
                  >
                    <i class="fa fa-download"></i>
                  </button>
                  <button
                    class="text-white icon-btn"
                    style={{
                      padding: '0.25rem',
                      fontSize: 'var(--font-size-base)'
                    }}
                    onClick={downloadPDF}
                    title="Download as PDF"
                  >
                    <i class="fa fa-file-pdf"></i>
                  </button>
                  <button
                    class="text-white icon-btn"
                    style={{
                      padding: '0.25rem',
                      fontSize: 'var(--font-size-base)'
                    }}
                    onClick={saveOutput}
                    title="Save to localStorage"
                  >
                    <i class="fa fa-save"></i>
                  </button>
                </div>
              </div>
              <div style={{
                padding: '1.25rem',
                maxHeight: '24rem',
                overflowY: 'auto',
                background: 'var(--surface-cream)'
              }}>
                <pre style={{
                  fontSize: 'var(--font-size-sm)',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  margin: 0
                }}>
                  {markdown.value}
                </pre>
              </div>
            </div>
            </section>
          )}

          {/* Section: Saved Outputs */}
          {savedOutputs.value.length > 0 && (
            <section style={{
              paddingTop: 'clamp(1.5rem, 4vw, 2rem)',
              marginTop: 'clamp(1.5rem, 4vw, 2rem)',
              borderTop: '2px solid var(--color-border)'
            }}>
              <h4 style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-text)',
                marginBottom: '1rem'
              }}>
                💾 Saved Outputs
              </h4>
              <div class="space-y-3">
                {savedOutputs.value.map((output) => (
                  <div
                    key={output.id}
                    class="rounded-lg"
                    style={{
                      padding: '1rem',
                      border: '2px solid var(--color-border)',
                      background: 'var(--surface-cream)'
                    }}
                  >
                    <div class="flex justify-between items-start" style={{ marginBottom: '0.75rem' }}>
                      <div class="flex-1 min-w-0">
                        <p style={{
                          fontWeight: '600',
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-accent)',
                          marginBottom: '0.25rem'
                        }}>
                          {output.prompt}
                        </p>
                        <p style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-secondary)'
                        }}>
                          {new Date(output.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div class="flex gap-2 ml-3">
                        <button
                          class="btn btn-ghost btn-sm"
                          style={{
                            minHeight: '2rem',
                            height: '2rem',
                            padding: '0.25rem 0.625rem'
                          }}
                          onClick={() => copySavedOutput(output.content)}
                          title="Copy"
                        >
                          <i class="fa fa-copy" style={{ fontSize: 'var(--font-size-xs)' }}></i>
                        </button>
                        <button
                          class="btn btn-ghost btn-sm text-error"
                          style={{
                            minHeight: '2rem',
                            height: '2rem',
                            padding: '0.25rem 0.625rem'
                          }}
                          onClick={() => deleteOutput(output.id)}
                          title="Delete"
                        >
                          <i class="fa fa-trash" style={{ fontSize: 'var(--font-size-xs)' }}></i>
                        </button>
                      </div>
                    </div>
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      lineHeight: '1.5',
                      color: 'var(--color-text-secondary)',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {output.content.substring(0, 150)}...
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
