/**
 * MarkdownMaker Drawer Island
 *
 * Right-hand slide-in drawer for converting conversations to different formats
 * Ported from Svelte conversation_mapper version
 */

import { signal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { markdownPrompts } from "../utils/markdownPrompts.ts";
import { showToast } from "../utils/toast.ts";

interface MarkdownMakerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transcript: string;
}

const selectedPromptId = signal<string | null>(null);
const customPrompt = signal("");
const markdown = signal("");
const loading = signal(false);
const error = signal<string | null>(null);

export default function MarkdownMakerDrawer({ isOpen, onClose, transcript }: MarkdownMakerDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

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
      // TODO: Implement Gemini API call
      // For now, just show a placeholder
      await new Promise(resolve => setTimeout(resolve, 1500));
      markdown.value = `# ${promptOption.label}\n\n*Generated from conversation*\n\n${transcript.substring(0, 200)}...\n\n*Note: Gemini API integration pending*`;
      showToast('Markdown generated!', 'success');
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Generation failed';
      showToast('Failed to generate markdown', 'error');
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
      // TODO: Implement Gemini API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      markdown.value = `# Custom Output\n\n*Generated with custom prompt*\n\n${transcript.substring(0, 200)}...\n\n*Note: Gemini API integration pending*`;
      showToast('Markdown generated!', 'success');
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Generation failed';
      showToast('Failed to generate markdown', 'error');
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

  if (!isOpen) return null;

  return (
    <>
      {/* Drawer */}
      <div
        ref={drawerRef}
        class={`fixed bottom-0 right-0 top-0 z-50 flex w-96 flex-col overflow-hidden border-l-4 border-soft-purple bg-paper shadow-brutal-lg ${
          isOpen ? 'animate-slide-in-right' : ''
        }`}
      >
        {/* Header */}
        <div class="bg-soft-purple px-4 py-3 border-b-4 border-purple-600 flex justify-between items-center">
          <h3 class="font-bold text-white">📝 Markdown Maker</h3>
          <button
            onClick={onClose}
            class="text-white hover:text-gray-200 cursor-pointer transition-colors"
            title="Close drawer"
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
        <div class="flex-1 overflow-y-auto p-4">
          {/* Quick Prompt Buttons */}
          <div class="mb-4 flex flex-wrap gap-2">
            {markdownPrompts.map((promptOption) => (
              <button
                key={promptOption.id}
                class={`btn btn-sm flex-1 min-w-[calc(50%-0.25rem)] ${
                  selectedPromptId.value === promptOption.id
                    ? 'bg-soft-purple text-white border-purple-600'
                    : 'bg-white border-2 border-gray-300 hover:border-soft-purple'
                }`}
                onClick={() => generateFromPreset(promptOption.id)}
                disabled={loading.value}
              >
                {promptOption.label}
              </button>
            ))}
          </div>

          {/* Custom Prompt Input */}
          <div class="mb-4">
            <label class="block text-sm font-semibold mb-2">Custom Prompt</label>
            <textarea
              class="w-full h-24 border-2 border-gray-300 rounded px-3 py-2 text-sm focus:border-soft-purple focus:outline-none"
              placeholder="Type your own custom prompt here..."
              value={customPrompt.value}
              onInput={(e) => customPrompt.value = (e.target as HTMLTextAreaElement).value}
            />
          </div>

          {/* Generate Custom Button */}
          <button
            class="btn w-full bg-soft-purple text-white border-purple-600 hover:bg-purple-500 mb-4"
            onClick={generateFromCustom}
            disabled={loading.value || !customPrompt.value.trim() || !transcript.trim()}
          >
            {loading.value && selectedPromptId.value === null ? (
              <span class="loading loading-spinner loading-sm"></span>
            ) : null}
            Generate Custom
          </button>

          {/* Loading Indicator for Preset Buttons */}
          {loading.value && selectedPromptId.value !== null && (
            <div class="flex justify-center mb-4">
              <span class="loading loading-spinner loading-lg text-soft-purple"></span>
            </div>
          )}

          {/* Error Display */}
          {error.value && (
            <div class="alert alert-error mb-4">
              <span class="text-sm">{error.value}</span>
            </div>
          )}

          {/* Markdown Preview */}
          {markdown.value && (
            <div class="border-4 border-soft-blue rounded-lg shadow-brutal-sm overflow-hidden">
              <div class="bg-soft-blue px-4 py-2 border-b-4 border-blue-600 flex justify-between items-center">
                <span class="font-bold text-white">Preview</span>
                <button
                  class="text-white hover:text-gray-200 cursor-pointer transition-colors"
                  onClick={copyToClipboard}
                  title="Copy to clipboard"
                >
                  <i class="fa fa-copy"></i>
                </button>
              </div>
              <div class="p-4 bg-white max-h-96 overflow-y-auto">
                <pre class="text-sm whitespace-pre-wrap font-mono">{markdown.value}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
