/**
 * Share Service - Generate Shareable Links
 *
 * Creates short share IDs and public URLs for conversations
 * Stores shared conversations in localStorage with share metadata
 */

import type { ConversationData } from "../../signals/conversationStore.ts";

// Storage key for shared conversations
const SHARES_KEY = "conversation_mapper_shares";

// ===================================================================
// TYPES
// ===================================================================

export interface SharedConversation extends ConversationData {
  shareId: string;
  sharedAt: string;
  expiresAt?: string; // Optional expiration
}

// ===================================================================
// SHARE ID GENERATION
// ===================================================================

/**
 * Generate a short, URL-friendly share ID
 * Format: 8 character alphanumeric (e.g., "a7k9m2x5")
 */
function generateShareId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";

  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return id;
}

/**
 * Ensure share ID is unique
 */
function getUniqueShareId(): string {
  const shares = getAllShares();
  let id = generateShareId();

  // Regenerate if collision (extremely rare)
  while (shares[id]) {
    id = generateShareId();
  }

  return id;
}

// ===================================================================
// CORE OPERATIONS
// ===================================================================

/**
 * Compress data for URL encoding
 */
function compressData(data: any): string {
  try {
    const jsonStr = JSON.stringify(data);
    // Simple compression: convert to base64
    return btoa(encodeURIComponent(jsonStr));
  } catch (error) {
    console.error("Failed to compress data:", error);
    return "";
  }
}

/**
 * Decompress data from URL encoding
 */
export function decompressData(compressed: string): any {
  try {
    const jsonStr = decodeURIComponent(atob(compressed));
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Failed to decompress data:", error);
    return null;
  }
}

/**
 * Create a shareable link for a conversation
 * Attempts URL-based sharing first, falls back to localStorage for large data
 */
export function createShare(data: ConversationData, expiresInDays?: number): string {
  if (typeof window === "undefined") return "";

  // Create minimal shareable data (exclude large audio blobs)
  const shareableData = {
    title: data.title,
    summary: data.summary,
    transcript: data.transcript,
    actionItems: data.actionItems,
    timestamp: data.timestamp || new Date().toISOString(),
  };

  // Try to compress for URL sharing
  const compressed = compressData(shareableData);

  // Check if data fits in URL (keep under 2000 chars for compatibility)
  if (compressed && compressed.length < 2000) {
    // Return compressed data as shareId for URL-based sharing
    return `url:${compressed}`;
  }

  // Fallback to localStorage for large data
  const shareId = getUniqueShareId();
  const shares = getAllShares();

  const shared: SharedConversation = {
    ...data,
    shareId,
    sharedAt: new Date().toISOString(),
    expiresAt: expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined,
  };

  shares[shareId] = shared;
  localStorage.setItem(SHARES_KEY, JSON.stringify(shares));

  return shareId;
}

/**
 * Get shareable URL for a conversation
 */
export function getShareUrl(shareId: string): string {
  if (typeof window === "undefined") return "";

  const baseUrl = window.location.origin;

  // Check if it's a URL-based share (compressed data)
  if (shareId.startsWith("url:")) {
    const data = shareId.slice(4); // Remove "url:" prefix
    return `${baseUrl}/shared?data=${encodeURIComponent(data)}`;
  }

  // Regular localStorage-based share
  return `${baseUrl}/shared/${shareId}`;
}

/**
 * Load a shared conversation by ID or from URL data
 */
export function loadSharedConversation(shareId: string): SharedConversation | null {
  if (typeof window === "undefined") return null;

  // Check if it's URL-based data
  if (shareId.startsWith("data:")) {
    const compressed = shareId.slice(5); // Remove "data:" prefix
    const data = decompressData(compressed);

    if (data) {
      return {
        ...data,
        shareId: "url-share",
        sharedAt: new Date().toISOString(),
        conversation: {
          id: `shared_${Date.now()}`,
          ...data
        }
      } as SharedConversation;
    }
  }

  // Regular localStorage-based share
  const shares = getAllShares();
  const shared = shares[shareId];

  if (!shared) return null;

  // Check if expired
  if (shared.expiresAt && new Date(shared.expiresAt) < new Date()) {
    deleteShare(shareId);
    return null;
  }

  return shared;
}

/**
 * Get all shared conversations
 */
export function getAllShares(): Record<string, SharedConversation> {
  if (typeof window === "undefined") return {};

  try {
    const data = localStorage.getItem(SHARES_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to load shares:", error);
    return {};
  }
}

/**
 * Delete a shared conversation
 */
export function deleteShare(shareId: string): void {
  if (typeof window === "undefined") return;

  const shares = getAllShares();
  delete shares[shareId];

  localStorage.setItem(SHARES_KEY, JSON.stringify(shares));
}

/**
 * Clean up expired shares
 */
export function cleanupExpiredShares(): number {
  if (typeof window === "undefined") return 0;

  const shares = getAllShares();
  const now = new Date();
  let cleaned = 0;

  Object.entries(shares).forEach(([shareId, shared]) => {
    if (shared.expiresAt && new Date(shared.expiresAt) < now) {
      delete shares[shareId];
      cleaned++;
    }
  });

  if (cleaned > 0) {
    localStorage.setItem(SHARES_KEY, JSON.stringify(shares));
  }

  return cleaned;
}

// ===================================================================
// SHARE MANAGEMENT
// ===================================================================

/**
 * Get list of all shares for current user's conversations
 */
export function getSharesForConversation(conversationId: string): SharedConversation[] {
  const shares = getAllShares();

  return Object.values(shares).filter(
    (share) => share.conversation.id === conversationId
  );
}

/**
 * Copy share URL to clipboard
 */
export async function copyShareUrlToClipboard(shareId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const url = getShareUrl(shareId);
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}

// ===================================================================
// STORAGE STATS
// ===================================================================

/**
 * Get share storage statistics
 */
export function getShareStats(): {
  totalShares: number;
  activeShares: number;
  expiredShares: number;
} {
  const shares = getAllShares();
  const now = new Date();

  let active = 0;
  let expired = 0;

  Object.values(shares).forEach((share) => {
    if (share.expiresAt && new Date(share.expiresAt) < now) {
      expired++;
    } else {
      active++;
    }
  });

  return {
    totalShares: active + expired,
    activeShares: active,
    expiredShares: expired,
  };
}
