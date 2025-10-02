/**
 * LocalStorage Service - Browser Persistence
 *
 * Stores conversations and action items in browser localStorage
 * No backend needed, works offline
 */

import type { ConversationData } from "../../signals/conversationStore.ts";

// Storage keys
const CONVERSATIONS_KEY = "conversation_mapper_conversations";
const ACTIVE_ID_KEY = "conversation_mapper_active_id";

// ===================================================================
// TYPES
// ===================================================================

export interface StoredConversation extends ConversationData {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ===================================================================
// CORE OPERATIONS
// ===================================================================

/**
 * Save a conversation to localStorage
 */
export function saveConversation(data: ConversationData): void {
  if (typeof window === "undefined") return;

  const conversations = getAllConversations();
  const conversationId = data.conversation.id;

  const stored: StoredConversation = {
    ...data,
    id: conversationId,
    createdAt: conversations[conversationId]?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  conversations[conversationId] = stored;

  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  localStorage.setItem(ACTIVE_ID_KEY, conversationId);
}

/**
 * Load a specific conversation by ID
 */
export function loadConversation(id: string): StoredConversation | null {
  if (typeof window === "undefined") return null;

  const conversations = getAllConversations();
  return conversations[id] || null;
}

/**
 * Get all conversations
 */
export function getAllConversations(): Record<string, StoredConversation> {
  if (typeof window === "undefined") return {};

  try {
    const data = localStorage.getItem(CONVERSATIONS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to load conversations:", error);
    return {};
  }
}

/**
 * Get conversation list (sorted by updatedAt desc)
 */
export function getConversationList(): StoredConversation[] {
  const conversations = getAllConversations();
  return Object.values(conversations).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/**
 * Delete a conversation
 */
export function deleteConversation(id: string): void {
  if (typeof window === "undefined") return;

  const conversations = getAllConversations();
  delete conversations[id];

  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));

  // Clear active ID if it was this conversation
  const activeId = getActiveConversationId();
  if (activeId === id) {
    localStorage.removeItem(ACTIVE_ID_KEY);
  }
}

/**
 * Get the currently active conversation ID
 */
export function getActiveConversationId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_ID_KEY);
}

/**
 * Clear all conversations (for debugging/reset)
 */
export function clearAllConversations(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(CONVERSATIONS_KEY);
  localStorage.removeItem(ACTIVE_ID_KEY);
}

// ===================================================================
// AUTO-SAVE HELPERS
// ===================================================================

let saveTimeout: number | null = null;

/**
 * Debounced save - prevents too frequent writes
 */
export function debouncedSave(data: ConversationData, delay = 500): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    saveConversation(data);
    saveTimeout = null;
  }, delay);
}

/**
 * Get storage usage stats
 */
export function getStorageStats(): {
  used: number;
  total: number;
  percentage: number;
} {
  if (typeof window === "undefined") {
    return { used: 0, total: 0, percentage: 0 };
  }

  try {
    const data = localStorage.getItem(CONVERSATIONS_KEY) || "";
    const used = new Blob([data]).size;
    const total = 5 * 1024 * 1024; // 5MB typical localStorage limit
    const percentage = (used / total) * 100;

    return { used, total, percentage };
  } catch {
    return { used: 0, total: 0, percentage: 0 };
  }
}
