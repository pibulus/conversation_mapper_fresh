/**
 * Mobile History Menu Island - Slide-out Drawer
 *
 * Mobile-optimized conversation history with touch-friendly controls
 */

import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import {
  getConversationList,
  loadConversation,
  deleteConversation,
  type StoredConversation,
} from "../core/storage/localStorage.ts";
import { conversationData } from "../signals/conversationStore.ts";

export default function MobileHistoryMenu() {
  const conversations = useSignal<StoredConversation[]>([]);
  const isOpen = useSignal(false);
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
      isOpen.value = false; // Close drawer after loading
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
    isOpen.value = false;
  }

  function toggleMenu() {
    isOpen.value = !isOpen.value;
  }

  const activeId = conversationData.value?.conversation.id;
  const hasConversations = conversations.value.length > 0;

  return (
    <>
      {/* Floating Menu Button - Now works on all screens! */}
      <button
        onClick={toggleMenu}
        class="fixed bottom-6 right-6 flex items-center justify-center z-40 transition-all"
        style={{
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '3px solid rgba(44, 44, 44, 0.2)',
          borderRadius: '16px',
          padding: '14px 18px',
          boxShadow: '0 6px 0 0 rgba(0, 0, 0, 0.1), 0 8px 24px rgba(0, 0, 0, 0.12)',
          cursor: 'pointer',
          fontWeight: '700',
          fontSize: '15px',
          color: '#2C2C2C',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 9px 0 0 rgba(0, 0, 0, 0.1), 0 12px 32px rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 6px 0 0 rgba(0, 0, 0, 0.1), 0 8px 24px rgba(0, 0, 0, 0.12)';
        }}
        aria-label="Open conversation history"
        title="View saved conversations"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span class="hidden sm:inline">History</span>
      </button>

      {/* Backdrop */}
      {isOpen.value && (
        <div
          class="fixed inset-0 z-30"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
          onClick={() => (isOpen.value = false)}
        />
      )}

      {/* Slide-out Drawer */}
      <div
        class={`fixed inset-y-0 right-0 w-96 max-w-[85vw] transform transition-all duration-300 ease-out z-40 ${
          isOpen.value ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderLeft: '3px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.12)'
        }}
      >
        {/* Header */}
        <div style={{
          background: 'rgba(232, 131, 156, 0.15)',
          borderBottom: '2px solid rgba(232, 131, 156, 0.3)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontWeight: '700',
            fontSize: '1.25rem',
            color: '#2C2C2C',
            letterSpacing: '-0.01em'
          }}>Your Conversations</h2>
          <button
            onClick={() => (isOpen.value = false)}
            style={{
              background: 'rgba(0, 0, 0, 0.05)',
              border: '2px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: '#2C2C2C',
              fontSize: '18px',
              fontWeight: '600'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ✕
          </button>
        </div>

        {/* New Conversation Button */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}>
          <button
            onClick={handleNew}
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: '16px',
              fontWeight: '700',
              border: '3px solid #2C2C2C',
              borderRadius: '12px',
              background: '#2C2C2C',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 0 0 rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 0 0 rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 0 0 rgba(0, 0, 0, 0.15)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(2px)';
              e.currentTarget.style.boxShadow = '0 2px 0 0 rgba(0, 0, 0, 0.15)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 0 0 rgba(0, 0, 0, 0.15)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Conversation
          </button>
        </div>

        {/* Conversation List */}
        <div class="flex-1 overflow-y-auto space-y-3 h-[calc(100vh-180px)]" style={{ padding: '1.25rem 1.5rem' }}>
          {!hasConversations ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#6B6B6B'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.4 }}>✨</div>
              <p style={{
                fontSize: '15px',
                fontWeight: '500',
                lineHeight: '1.6'
              }}>
                No conversations yet.<br/>
                Start creating some magic!
              </p>
            </div>
          ) : (
            conversations.value.map((conv) => {
              const isActive = activeId === conv.id;
              const truncatedTitle = conv.conversation.title?.substring(0, 35) || "Untitled";
              const date = new Date(conv.updatedAt);
              const dateStr = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={conv.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: isActive ? '3px solid rgba(232, 131, 156, 0.5)' : '2px solid rgba(0, 0, 0, 0.08)',
                    background: isActive ? 'rgba(232, 131, 156, 0.08)' : 'rgba(255, 255, 255, 0.6)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'rgba(232, 131, 156, 0.3)';
                      e.currentTarget.style.background = 'rgba(232, 131, 156, 0.04)';
                      e.currentTarget.style.transform = 'translateX(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <button
                      onClick={() => handleLoad(conv.id)}
                      style={{
                        flex: 1,
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <h3 style={{
                        fontWeight: '700',
                        color: '#2C2C2C',
                        fontSize: '15px',
                        marginBottom: '0.5rem',
                        lineHeight: '1.3'
                      }}>
                        {truncatedTitle}
                      </h3>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '0.5rem',
                        fontSize: '12px'
                      }}>
                        <span style={{
                          background: 'rgba(59, 130, 246, 0.12)',
                          color: '#2563EB',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontWeight: '600'
                        }}>
                          {conv.nodes.length} topics
                        </span>
                        <span style={{
                          background: 'rgba(34, 197, 94, 0.12)',
                          color: '#16A34A',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontWeight: '600'
                        }}>
                          {conv.actionItems.length} items
                        </span>
                      </div>
                      <p style={{
                        fontSize: '12px',
                        color: '#8B7F77',
                        marginTop: '0.5rem',
                        fontWeight: '500'
                      }}>
                        {dateStr}
                      </p>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(conv.id);
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '2px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        padding: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '16px',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.transform = 'scale(1)';
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

        {/* Storage Info */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          background: 'rgba(0, 0, 0, 0.02)'
        }}>
          <p style={{
            fontSize: '13px',
            color: '#8B7F77',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            {conversations.value.length} conversation{conversations.value.length !== 1 ? 's' : ''} saved locally
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete.value && (
        <div class="fixed inset-0 flex items-center justify-center z-50 px-4" style={{
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '3px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.2)',
            padding: '2rem',
            maxWidth: '400px',
            width: '100%'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '0.75rem',
              color: '#2C2C2C',
              lineHeight: '1.2'
            }}>Delete this conversation?</h3>
            <p style={{
              fontSize: '15px',
              color: '#6B6B6B',
              marginBottom: '1.5rem',
              lineHeight: '1.6'
            }}>
              This will permanently delete this conversation and all its data. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  fontSize: '16px',
                  fontWeight: '700',
                  border: '3px solid #DC2626',
                  borderRadius: '12px',
                  background: '#EF4444',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 0 0 rgba(220, 38, 38, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 0 0 rgba(220, 38, 38, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 0 0 rgba(220, 38, 38, 0.3)';
                }}
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  fontSize: '16px',
                  fontWeight: '700',
                  border: '3px solid rgba(0, 0, 0, 0.15)',
                  borderRadius: '12px',
                  background: 'rgba(0, 0, 0, 0.05)',
                  color: '#2C2C2C',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 0 0 rgba(0, 0, 0, 0.08)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 0 0 rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 0 0 rgba(0, 0, 0, 0.08)';
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}