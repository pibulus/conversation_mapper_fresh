/**
 * Conversation List Island - History Sidebar
 *
 * Shows all saved conversations with load/delete actions
 * Auto-updates when conversations change
 */

import { useSignal, useComputed } from "@preact/signals";
import { useEffect } from "preact/hooks";
import {
  getConversationList,
  loadConversation,
  deleteConversation,
  type StoredConversation,
} from "../core/storage/localStorage.ts";
import { conversationData } from "../signals/conversationStore.ts";

export default function ConversationList() {
  const conversations = useSignal<StoredConversation[]>([]);
  const showConfirmDelete = useSignal<string | null>(null);

  // Load conversations on mount
  useEffect(() => {
    refreshList();
  }, []);

  // Refresh list when conversationData changes
  useEffect(() => {
    if (conversationData.value) {
      refreshList();
    }
  }, [conversationData.value]);

  function refreshList() {
    conversations.value = getConversationList();
  }

  function handleLoad(id: string) {
    const conv = loadConversation(id);
    if (conv) {
      conversationData.value = conv;
    }
  }

  function handleDelete(id: string) {
    showConfirmDelete.value = id;
  }

  function confirmDelete() {
    if (showConfirmDelete.value) {
      deleteConversation(showConfirmDelete.value);

      // Clear active conversation if it was deleted
      if (conversationData.value?.conversation.id === showConfirmDelete.value) {
        conversationData.value = null;
      }

      refreshList();
      showConfirmDelete.value = null;
    }
  }

  function cancelDelete() {
    showConfirmDelete.value = null;
  }

  function handleNew() {
    conversationData.value = null;
  }

  const activeId = useComputed(() => conversationData.value?.conversation.id);

  return (
    <div class="flex flex-col h-full" style={{
      background: 'var(--color-secondary)',
      borderRight: `var(--border-width) solid var(--color-border)`
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--color-accent)',
        padding: 'var(--card-padding)',
        borderBottom: `var(--border-width) solid var(--color-border)`
      }}>
        <h2 style={{
          fontSize: 'var(--heading-size)',
          fontWeight: 'var(--heading-weight)',
          color: 'white'
        }}>📚 Conversations</h2>
      </div>

      {/* New Conversation Button */}
      <div class="p-3" style={{
        borderBottom: `2px solid var(--color-border)`
      }}>
        <button
          onClick={handleNew}
          class="w-full font-bold py-2 px-4 rounded-lg"
          style={{
            background: 'var(--color-accent)',
            color: 'white',
            border: `2px solid var(--color-border)`,
            fontSize: 'var(--text-size)',
            transition: 'var(--transition-fast)'
          }}
        >
          ➕ New Conversation
        </button>
      </div>

      {/* Conversation List */}
      <div class="flex-1 overflow-y-auto p-3 space-y-2">
        {conversations.value.length === 0 ? (
          <p class="text-center py-8" style={{
            fontSize: 'var(--small-size)',
            color: 'var(--color-text-secondary)'
          }}>
            No saved conversations yet.<br/>
            Upload audio or text to begin!
          </p>
        ) : (
          conversations.value.map((conv) => {
            const isActive = activeId.value === conv.id;
            const truncatedTitle = conv.conversation.title?.substring(0, 40) || "Untitled";

            return (
              <div
                key={conv.id}
                class="p-3 rounded-lg"
                style={{
                  border: `2px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background: isActive ? 'var(--color-base-solid)' : 'transparent',
                  boxShadow: isActive ? 'var(--shadow-soft)' : 'none',
                  transition: 'var(--transition-medium)',
                  opacity: isActive ? 1 : 0.7
                }}
              >
                <div class="flex items-start justify-between gap-2">
                  <button
                    onClick={() => handleLoad(conv.id)}
                    class="flex-1 text-left"
                  >
                    <h3 class="font-semibold truncate" style={{
                      fontSize: 'var(--text-size)',
                      color: 'var(--color-text)'
                    }}>
                      {truncatedTitle}
                    </h3>
                    <div class="flex items-center gap-2 mt-1" style={{
                      fontSize: 'var(--tiny-size)',
                      color: 'var(--color-text-secondary)'
                    }}>
                      <span>📊 {conv.nodes.length} topics</span>
                      <span>•</span>
                      <span>✅ {conv.actionItems.length} items</span>
                    </div>
                    <p class="mt-1" style={{
                      fontSize: 'var(--tiny-size)',
                      color: 'var(--color-text-secondary)'
                    }}>
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                  </button>

                  <button
                    onClick={() => handleDelete(conv.id)}
                    class="p-1 hover:opacity-70"
                    style={{
                      color: '#EF4444',
                      transition: 'var(--transition-fast)'
                    }}
                    title="Delete conversation"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete.value && (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="rounded-lg p-6 max-w-sm mx-4" style={{
            background: 'var(--color-secondary)',
            border: `var(--border-width) solid #EF4444`,
            boxShadow: 'var(--shadow-lifted)'
          }}>
            <h3 class="mb-3" style={{
              fontSize: 'calc(var(--heading-size) * 1.4)',
              fontWeight: 'var(--heading-weight)',
              color: 'var(--color-text)'
            }}>🗑️ Delete Conversation?</h3>
            <p class="mb-6" style={{
              fontSize: 'var(--text-size)',
              color: 'var(--color-text-secondary)'
            }}>
              This will permanently delete this conversation and all its data.
              This action cannot be undone.
            </p>
            <div class="flex gap-2">
              <button
                onClick={confirmDelete}
                class="flex-1 font-bold py-2 px-4 rounded"
                style={{
                  background: '#EF4444',
                  color: 'white',
                  border: `2px solid #B91C1C`,
                  fontSize: 'var(--text-size)',
                  transition: 'var(--transition-fast)'
                }}
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                class="flex-1 font-bold py-2 px-4 rounded"
                style={{
                  background: 'var(--color-secondary)',
                  color: 'var(--color-text)',
                  border: `2px solid var(--color-border)`,
                  fontSize: 'var(--text-size)',
                  transition: 'var(--transition-fast)'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
