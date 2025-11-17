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
const RECORDINGS_KEY = "conversation_mapper_recordings";

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

// ===================================================================
// RECORDINGS STORAGE
// ===================================================================

export interface StoredRecording {
  id: string;
  conversation_id: string;
  file_name: string;
  audio_data: string; // Base64 encoded audio blob
  mime_type: string;
  created_at: string;
}

/**
 * Save recordings for a conversation to localStorage
 *
 * Converts audio Blobs to base64 for persistent storage.
 * Automatically handles format conversion and error recovery.
 *
 * @param conversationId - Unique conversation identifier
 * @param recordings - Array of recording objects with Blob data
 * @returns Promise that resolves when save is complete
 *
 * @example
 * await saveRecordings('conv-123', [
 *   { id: 'rec-1', conversation_id: 'conv-123', file_name: 'Recording 1', data: audioBlob, created_at: '2025-01-01' }
 * ]);
 */
export async function saveRecordings(
  conversationId: string,
  recordings: Array<{ id: string; conversation_id: string; file_name: string; data: Blob; created_at: string }>
): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const allRecordings = getAllRecordings();

    // Convert Blobs to base64 for storage
    const storedRecordings: StoredRecording[] = await Promise.all(
      recordings.map(async (rec) => ({
        id: rec.id,
        conversation_id: rec.conversation_id,
        file_name: rec.file_name,
        audio_data: await blobToBase64(rec.data),
        mime_type: rec.data.type,
        created_at: rec.created_at
      }))
    );

    allRecordings[conversationId] = storedRecordings;
    localStorage.setItem(RECORDINGS_KEY, JSON.stringify(allRecordings));
  } catch (error) {
    console.error("Failed to save recordings:", error);
  }
}

/**
 * Load recordings for a conversation from localStorage
 *
 * Retrieves saved recordings and converts base64 back to audio Blobs.
 * Returns empty array if no recordings found or on error.
 *
 * @param conversationId - Unique conversation identifier
 * @returns Array of recording objects with reconstructed Blob data
 *
 * @example
 * const recordings = loadRecordings('conv-123');
 * // Returns: [{ id, conversation_id, file_name, data: Blob, created_at }]
 */
export function loadRecordings(
  conversationId: string
): Array<{ id: string; conversation_id: string; file_name: string; data: Blob; created_at: string }> {
  if (typeof window === "undefined") return [];

  try {
    const allRecordings = getAllRecordings();
    const stored = allRecordings[conversationId] || [];

    // Convert base64 back to Blobs
    return stored.map((rec) => ({
      id: rec.id,
      conversation_id: rec.conversation_id,
      file_name: rec.file_name,
      data: base64ToBlob(rec.audio_data, rec.mime_type),
      created_at: rec.created_at
    }));
  } catch (error) {
    console.error("Failed to load recordings:", error);
    return [];
  }
}

/**
 * Get all recordings (all conversations)
 */
function getAllRecordings(): Record<string, StoredRecording[]> {
  if (typeof window === "undefined") return {};

  try {
    const data = localStorage.getItem(RECORDINGS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to load recordings:", error);
    return {};
  }
}

/**
 * Clear recordings for a specific conversation
 */
export function clearRecordings(conversationId: string): void {
  if (typeof window === "undefined") return;

  const allRecordings = getAllRecordings();
  delete allRecordings[conversationId];
  localStorage.setItem(RECORDINGS_KEY, JSON.stringify(allRecordings));
}

/**
 * Convert Blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:audio/webm;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert base64 string back to Blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
