/**
 * Share Service - Generate Shareable Links
 *
 * Creates public URL payloads for small conversations.
 * Large conversations are saved locally only; those links are not portable.
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

export interface ShareCreationResult {
  shareId: string;
  url: string;
  mode: "public-url" | "local-only";
  expiresAt?: string;
  warning?: string;
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

function createShareableData(data: ConversationData): ConversationData {
  return {
    conversation: {
      id: data.conversation.id,
      title: data.conversation.title,
      source: data.conversation.source,
      transcript: data.conversation.transcript,
      created_at: data.conversation.created_at,
    },
    transcript: data.transcript,
    nodes: data.nodes ?? [],
    edges: data.edges ?? [],
    actionItems: data.actionItems ?? [],
    statusUpdates: data.statusUpdates ?? [],
    summary: data.summary,
  };
}

function normalizeSharedData(data: any): ConversationData | null {
  if (!data || typeof data !== "object") return null;

  const transcript = data.transcript && typeof data.transcript === "object"
    ? {
      text: String(data.transcript.text ?? data.conversation?.transcript ?? ""),
      speakers: Array.isArray(data.transcript.speakers)
        ? data.transcript.speakers
        : [],
    }
    : {
      text: String(data.transcript ?? data.conversation?.transcript ?? ""),
      speakers: [],
    };

  return {
    conversation: {
      id: String(data.conversation?.id ?? `shared_${Date.now()}`),
      title: data.conversation?.title ?? data.title,
      source: String(data.conversation?.source ?? "shared"),
      transcript: String(data.conversation?.transcript ?? transcript.text),
      created_at: data.conversation?.created_at ?? data.timestamp,
    },
    transcript,
    nodes: Array.isArray(data.nodes) ? data.nodes : [],
    edges: Array.isArray(data.edges) ? data.edges : [],
    actionItems: Array.isArray(data.actionItems) ? data.actionItems : [],
    statusUpdates: Array.isArray(data.statusUpdates) ? data.statusUpdates : [],
    summary: data.summary,
  };
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

export function encodeShareDataForUrl(data: ConversationData): string {
  return compressData(createShareableData(data));
}

export function loadUrlSharedConversation(
  compressed: string,
): SharedConversation | null {
  const data = decompressData(compressed);
  const normalized = normalizeSharedData(data);

  if (!normalized) return null;

  return {
    ...normalized,
    shareId: "url-share",
    sharedAt: new Date().toISOString(),
  };
}

/**
 * Create a shareable link for a conversation
 * Attempts URL-based sharing first, falls back to localStorage for large data
 */
export function createShare(
  data: ConversationData,
  expiresInDays?: number,
): string {
  return createShareLink(data, expiresInDays).shareId;
}

export function createShareLink(
  data: ConversationData,
  expiresInDays?: number,
): ShareCreationResult {
  if (typeof window === "undefined") {
    return {
      shareId: "",
      url: "",
      mode: "local-only",
      warning: "Sharing is only available in the browser.",
    };
  }

  const shareableData = createShareableData(data);
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : undefined;

  // Try to compress for URL sharing
  const compressed = encodeShareDataForUrl(shareableData);

  // Check if data fits in URL (keep under 2000 chars for compatibility)
  if (compressed && compressed.length < 2000) {
    const shareId = `url:${compressed}`;
    return {
      shareId,
      url: getShareUrl(shareId),
      mode: "public-url",
    };
  }

  // Fallback to localStorage for large data. This is intentionally marked
  // local-only because the data does not leave this browser.
  const shareId = getUniqueShareId();
  const shares = getAllShares();

  const shared: SharedConversation = {
    ...data,
    shareId,
    sharedAt: new Date().toISOString(),
    expiresAt,
  };

  shares[shareId] = shared;
  localStorage.setItem(SHARES_KEY, JSON.stringify(shares));

  return {
    shareId,
    url: getShareUrl(shareId),
    mode: "local-only",
    expiresAt,
    warning:
      "This conversation is too large for a portable URL, so it was saved on this browser only.",
  };
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
export function loadSharedConversation(
  shareId: string,
): SharedConversation | null {
  if (typeof window === "undefined") return null;

  // Check if it's URL-based data
  if (shareId.startsWith("data:")) {
    const compressed = shareId.slice(5); // Remove "data:" prefix
    return loadUrlSharedConversation(compressed);
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
export function getSharesForConversation(
  conversationId: string,
): SharedConversation[] {
  const shares = getAllShares();

  return Object.values(shares).filter(
    (share) => share.conversation.id === conversationId,
  );
}

/**
 * Copy share URL to clipboard
 */
export async function copyShareUrlToClipboard(
  shareId: string,
): Promise<boolean> {
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
