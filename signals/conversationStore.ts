/**
 * Shared Conversation Store
 *
 * Global signals for sharing conversation data between islands
 * Auto-saves to localStorage on updates (unless viewing shared)
 */

import { effect, signal } from "@preact/signals";
import { debouncedSave } from "../core/storage/localStorage.ts";

export interface ConversationData {
  conversation: {
    id: string;
    title?: string;
    source: string;
    transcript: string;
    created_at?: string;
  };
  transcript: {
    text: string;
    speakers: string[];
  };
  nodes: Array<{
    id: string;
    label: string;
    emoji: string;
    color: string;
  }>;
  edges: Array<{
    id?: string;
    source_topic_id: string;
    target_topic_id: string;
    color: string;
  }>;
  actionItems: Array<{
    id: string;
    conversation_id: string;
    description: string;
    assignee: string | null;
    due_date: string | null;
    status: "pending" | "completed";
    created_at: string;
    updated_at: string;
  }>;
  statusUpdates: Array<any>;
  summary?: string;
}

// Global conversation data signal
export const conversationData = signal<ConversationData | null>(null);

// Flag to prevent auto-save when viewing shared conversations
export const isViewingShared = signal<boolean>(false);

// Global processing state (true when AI is analyzing)
export const isProcessing = signal<boolean>(false);

// Auto-save to localStorage whenever conversationData changes
// SKIP auto-save when viewing shared conversations
if (typeof window !== "undefined") {
  effect(() => {
    const data = conversationData.value;

    // Only auto-save if we have data AND we're not viewing a shared conversation
    if (data && !isViewingShared.value) {
      debouncedSave(data);
    }
  });
}
