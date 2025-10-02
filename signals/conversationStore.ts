/**
 * Shared Conversation Store
 *
 * Global signals for sharing conversation data between islands
 */

import { signal } from "@preact/signals";

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
}

// Global conversation data signal
export const conversationData = signal<ConversationData | null>(null);
