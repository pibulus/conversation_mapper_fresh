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
    <div class="space-y-3">
      {/* Share Button */}
      <button
        onClick={handleShare}
        disabled={!canShare.value || isGenerating.value}
        class={`w-full font-bold py-2 px-4 rounded-lg border-2 transition-colors ${
          canShare.value && !isGenerating.value
            ? "bg-green-500 text-white border-green-700 hover:bg-green-600"
            : "bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed"
        }`}
      >
        {isGenerating.value ? "🔄 Generating..." : "🔗 Share Conversation"}
      </button>

      {/* Share URL Display */}
      {shareUrl.value && (
        <div class="bg-green-50 border-2 border-green-300 rounded-lg p-3 space-y-2">
          <p class="text-xs font-bold text-green-800">Share Link:</p>
          <div class="flex gap-2">
            <input
              type="text"
              value={shareUrl.value}
              readonly
              class="flex-1 text-xs px-2 py-1 bg-white border-2 border-green-300 rounded font-mono"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={handleCopyAgain}
              class="bg-green-500 text-white px-3 py-1 rounded border-2 border-green-700 hover:bg-green-600 text-xs font-bold"
            >
              📋
            </button>
          </div>
          <p class="text-xs text-green-700">
            ✅ Link expires in 30 days
          </p>
        </div>
      )}

      {/* Copied Notification */}
      {showCopied.value && (
        <div class="bg-purple-100 border-2 border-purple-400 rounded-lg p-2 text-center animate-pulse">
          <p class="text-sm font-bold text-purple-700">
            ✨ Copied to clipboard!
          </p>
        </div>
      )}

      {/* Help Text */}
      {!canShare.value && (
        <p class="text-xs text-gray-500 text-center">
          Upload a conversation to enable sharing
        </p>
      )}
    </div>
  );
}
