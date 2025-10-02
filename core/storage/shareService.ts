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
 * Create a shareable link for a conversation
 */
export function createShare(data: ConversationData, expiresInDays?: number): string {
  if (typeof window === "undefined") return "";

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
  return `${baseUrl}/shared/${shareId}`;
}

/**
 * Load a shared conversation by ID
 */
export function loadSharedConversation(shareId: string): SharedConversation | null {
  if (typeof window === "undefined") return null;

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
