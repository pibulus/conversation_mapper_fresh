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
      {/* Floating Menu Button (Mobile Only) */}
      <button
        onClick={toggleMenu}
        class="md:hidden fixed bottom-6 right-6 bg-purple-500 text-white rounded-full w-14 h-14 shadow-brutal flex items-center justify-center z-40 border-3 border-purple-700 hover:bg-purple-600 transition-colors"
        aria-label="Open conversation history"
      >
        {isOpen.value ? "✕" : "📚"}
      </button>

      {/* Backdrop */}
      {isOpen.value && (
        <div
          class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => (isOpen.value = false)}
        />
      )}

      {/* Slide-out Drawer */}
      <div
        class={`md:hidden fixed inset-y-0 right-0 w-80 max-w-[80vw] bg-white transform transition-transform duration-300 ease-out z-40 shadow-brutal ${
          isOpen.value ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div class="bg-purple-400 px-4 py-4 border-b-4 border-purple-500 flex justify-between items-center">
          <h2 class="font-bold text-white text-lg">📚 History</h2>
          <button
            onClick={() => (isOpen.value = false)}
            class="text-white text-2xl hover:bg-purple-500 rounded px-2"
          >
            ✕
          </button>
        </div>

        {/* New Conversation Button */}
        <div class="p-4 border-b-2 border-purple-200">
          <button
            onClick={handleNew}
            class="w-full bg-terminal-green text-soft-black font-bold py-3 px-4 rounded-lg border-2 border-green-700 hover:bg-green-400 transition-colors text-lg"
          >
            ➕ New Conversation
          </button>
        </div>

        {/* Conversation List */}
        <div class="flex-1 overflow-y-auto p-4 space-y-3 h-[calc(100vh-180px)]">
          {!hasConversations ? (
            <div class="text-center py-8">
              <div class="text-4xl mb-4">📭</div>
              <p class="text-sm text-gray-500">
                No saved conversations yet.<br/>
                Upload audio or text to begin!
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
                  class={`p-4 rounded-lg border-3 transition-all ${
                    isActive
                      ? "bg-purple-100 border-purple-400 shadow-lg"
                      : "bg-gray-50 border-gray-300 hover:border-purple-300 hover:bg-purple-50"
                  }`}
                >
                  <div class="flex items-start justify-between gap-3">
                    <button
                      onClick={() => handleLoad(conv.id)}
                      class="flex-1 text-left"
                    >
                      <h3 class="font-bold text-gray-800 text-base">
                        {truncatedTitle}
                      </h3>
                      <div class="flex flex-wrap items-center gap-2 mt-2 text-xs">
                        <span class="bg-blue-100 px-2 py-1 rounded">
                          📊 {conv.nodes.length} topics
                        </span>
                        <span class="bg-green-100 px-2 py-1 rounded">
                          ✅ {conv.actionItems.length} items
                        </span>
                      </div>
                      <p class="text-xs text-gray-500 mt-2">
                        {dateStr}
                      </p>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(conv.id);
                      }}
                      class="text-red-500 hover:text-red-700 p-2 text-xl"
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
        <div class="p-3 border-t-2 border-gray-200 bg-gray-50">
          <p class="text-xs text-gray-600 text-center">
            {conversations.value.length} conversation{conversations.value.length !== 1 ? 's' : ''} saved locally
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete.value && (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div class="bg-white rounded-lg border-4 border-red-400 shadow-brutal p-6 max-w-sm w-full">
            <h3 class="text-xl font-bold mb-3">🗑️ Delete Conversation?</h3>
            <p class="text-sm text-gray-700 mb-6">
              This will permanently delete this conversation and all its data.
              This action cannot be undone.
            </p>
            <div class="flex gap-2">
              <button
                onClick={confirmDelete}
                class="flex-1 bg-red-500 text-white font-bold py-3 px-4 rounded-lg border-2 border-red-700 hover:bg-red-600 text-base"
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                class="flex-1 bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg border-2 border-gray-400 hover:bg-gray-300 text-base"
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