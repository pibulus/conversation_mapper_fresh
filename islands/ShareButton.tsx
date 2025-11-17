/**
 * Share Button Island - Generate Shareable Links
 *
 * Creates share links for conversations with copy-to-clipboard
 */

import { useSignal, useComputed } from "@preact/signals";
import { conversationData } from "../signals/conversationStore.ts";
import {
  createShare,
  getShareUrl,
  copyShareUrlToClipboard,
} from "../core/storage/shareService.ts";

export default function ShareButton() {
  const shareUrl = useSignal<string | null>(null);
  const showCopied = useSignal(false);
  const isGenerating = useSignal(false);

  // Check if we have conversation data to share
  const canShare = useComputed(() => conversationData.value !== null);

  async function handleShare() {
    if (!conversationData.value) return;

    isGenerating.value = true;

    try {
      // Create share (expires in 30 days)
      const shareId = createShare(conversationData.value, 30);
      const url = getShareUrl(shareId);

      shareUrl.value = url;

      // Copy to clipboard
      const copied = await copyShareUrlToClipboard(shareId);

      if (copied) {
        showCopied.value = true;
        setTimeout(() => {
          showCopied.value = false;
        }, 3000);
      }
    } catch (error) {
      console.error("Failed to create share:", error);
    } finally {
      isGenerating.value = false;
    }
  }

  function handleCopyAgain() {
    if (!shareUrl.value) return;

    // Extract shareId from URL
    const shareId = shareUrl.value.split("/").pop();
    if (shareId) {
      copyShareUrlToClipboard(shareId);
      showCopied.value = true;
      setTimeout(() => {
        showCopied.value = false;
      }, 3000);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Share Button */}
      <button
        onClick={handleShare}
        disabled={!canShare.value || isGenerating.value}
        class="btn btn-sm"
        style={{
          width: '100%',
          background: canShare.value && !isGenerating.value ? 'var(--color-accent)' : 'var(--surface-cream-hover)',
          color: canShare.value && !isGenerating.value ? 'white' : 'var(--color-text-secondary)',
          borderColor: canShare.value && !isGenerating.value ? 'var(--color-accent)' : 'var(--border-cream-medium)',
          cursor: canShare.value && !isGenerating.value ? 'pointer' : 'not-allowed',
          fontWeight: '600',
          fontSize: 'var(--font-size-sm)'
        }}
        onMouseEnter={(e) => {
          if (canShare.value && !isGenerating.value) {
            e.currentTarget.style.background = 'var(--soft-brown)';
            e.currentTarget.style.borderColor = 'var(--soft-brown)';
          }
        }}
        onMouseLeave={(e) => {
          if (canShare.value && !isGenerating.value) {
            e.currentTarget.style.background = 'var(--color-accent)';
            e.currentTarget.style.borderColor = 'var(--color-accent)';
          }
        }}
      >
        {isGenerating.value ? "🔄 Generating..." : "🔗 Share"}
      </button>

      {/* Share URL Display */}
      {shareUrl.value && (
        <div class="rounded-lg" style={{
          background: 'rgba(var(--color-accent-rgb), 0.06)',
          border: '2px solid rgba(var(--color-accent-rgb), 0.2)',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <p style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-accent)'
          }}>
            Share Link
          </p>
          <div class="flex gap-2">
            <input
              type="text"
              value={shareUrl.value}
              readonly
              class="flex-1 rounded"
              style={{
                fontSize: 'var(--font-size-xs)',
                padding: '0.5rem',
                background: 'var(--surface-white-warm)',
                border: '2px solid var(--border-cream-medium)',
                fontFamily: 'monospace',
                color: 'var(--color-text)'
              }}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={handleCopyAgain}
              class="btn btn-sm"
              style={{
                background: 'var(--color-accent)',
                color: 'white',
                borderColor: 'var(--color-accent)',
                padding: '0.5rem 0.75rem',
                minWidth: '2.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--soft-brown)';
                e.currentTarget.style.borderColor = 'var(--soft-brown)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-accent)';
                e.currentTarget.style.borderColor = 'var(--color-accent)';
              }}
            >
              📋
            </button>
          </div>
          <p style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)'
          }}>
            ✅ Link expires in 30 days
          </p>
        </div>
      )}

      {/* Copied Notification */}
      {showCopied.value && (
        <div class="rounded-lg text-center" style={{
          background: 'rgba(var(--color-accent-rgb), 0.12)',
          border: '2px solid rgba(var(--color-accent-rgb), 0.3)',
          padding: '0.5rem',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: '600',
            color: 'var(--color-accent)'
          }}>
            ✨ Copied to clipboard!
          </p>
        </div>
      )}

      {/* Help Text */}
      {!canShare.value && (
        <p style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-secondary)',
          textAlign: 'center'
        }}>
          Upload a conversation to enable sharing
        </p>
      )}
    </div>
  );
}
