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
      background: 'var(--surface-glass-warm)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRight: '2px solid var(--border-cream)'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '2px solid var(--border-cream)'
      }}>
        <h2 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--soft-black)'
        }}>Conversations</h2>
      </div>

      {/* New Conversation Button */}
      <div class="p-3" style={{
        borderBottom: '2px solid var(--border-cream)'
      }}>
        <button
          onClick={handleNew}
          class="btn w-full"
          style={{
            background: 'var(--soft-black)',
            color: 'white',
            borderColor: 'var(--soft-black)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--soft-brown)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--soft-black)'}
        >
          New Conversation
        </button>
      </div>

      {/* Conversation List */}
      <div class="flex-1 overflow-y-auto p-3 space-y-2">
        {conversations.value.length === 0 ? (
          <p class="text-center py-8" style={{
            fontSize: '14px',
            color: 'var(--color-text-secondary)',
            lineHeight: '1.5'
          }}>
            No saved conversations yet.<br/>
            Upload audio or text to begin.
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
                  border: `2px solid ${isActive ? 'var(--color-accent)' : 'var(--border-cream)'}`,
                  background: isActive ? 'rgba(var(--color-accent-rgb), 0.08)' : 'var(--surface-cream)',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--surface-cream-hover)';
                    e.currentTarget.style.borderColor = 'var(--border-cream-medium)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--surface-cream)';
                    e.currentTarget.style.borderColor = 'var(--border-cream)';
                  }
                }}
              >
                <div class="flex items-start justify-between gap-2">
                  <button
                    onClick={() => handleLoad(conv.id)}
                    class="flex-1 text-left"
                  >
                    <h3 class="truncate" style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--soft-black)',
                      marginBottom: '4px'
                    }}>
                      {truncatedTitle}
                    </h3>
                    <div class="flex items-center gap-2" style={{
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)'
                    }}>
                      <span>{conv.nodes.length} topics</span>
                      <span>•</span>
                      <span>{conv.actionItems.length} items</span>
                    </div>
                    <p style={{
                      fontSize: '11px',
                      color: '#999',
                      marginTop: '4px'
                    }}>
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                  </button>

                  <button
                    onClick={() => handleDelete(conv.id)}
                    class="p-1"
                    style={{
                      color: '#EF4444',
                      fontSize: '14px',
                      transition: 'opacity 0.15s ease',
                      opacity: 0.5
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                    title="Delete conversation"
                  >
                    <i class="fa fa-trash"></i>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete.value && (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={cancelDelete}>
          <div
            class="rounded-lg p-6 max-w-sm mx-4"
            style={{
              background: 'var(--surface-white-warm)',
              border: '2px solid var(--border-cream-medium)',
              boxShadow: 'var(--shadow-xl-warm)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 class="mb-3" style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--soft-black)'
            }}>Delete Conversation?</h3>
            <p class="mb-6" style={{
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              lineHeight: '1.5'
            }}>
              This will permanently delete this conversation and all its data.
              This action cannot be undone.
            </p>
            <div class="flex gap-2">
              <button
                onClick={confirmDelete}
                class="btn flex-1"
                style={{
                  background: 'var(--color-danger)',
                  color: 'white',
                  borderColor: 'var(--color-danger)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#DC2626';
                  e.currentTarget.style.borderColor = '#DC2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--color-danger)';
                  e.currentTarget.style.borderColor = 'var(--color-danger)';
                }}
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                class="btn flex-1"
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
