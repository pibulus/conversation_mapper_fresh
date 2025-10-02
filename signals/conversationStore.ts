/**
 * Shared Conversation Store
 *
 * Global signals for sharing conversation data between islands
 * Auto-saves to localStorage on updates
 */

import { signal, effect } from "@preact/signals";
import { debouncedSave } from "../core/storage/localStorage.ts";

export interface ConversationData {
  conversation: {
    id: string;
    title?: string;
    source: string;
    transcript: string;
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
    source_topic_id: string;
    target_topic_id: string;
    color: string;
  }>;
  actionItems: Array<{
    id: string;
    description: string;
    assignee: string | null;
    due_date: string | null;
    status: 'pending' | 'completed';
  }>;
  statusUpdates: Array<any>;
  summary?: string;
}

// Global conversation data signal
export const conversationData = signal<ConversationData | null>(null);

// Auto-save to localStorage whenever conversationData changes
if (typeof window !== "undefined") {
  effect(() => {
    const data = conversationData.value;
    if (data) {
      debouncedSave(data);
    }
  });
}
