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
    <div class="flex flex-col h-full bg-white border-r-4 border-purple-300">
      {/* Header */}
      <div class="bg-purple-400 px-4 py-3 border-b-4 border-purple-500">
        <h2 class="font-bold text-white">📚 Conversations</h2>
      </div>

      {/* New Conversation Button */}
      <div class="p-3 border-b-2 border-purple-200">
        <button
          onClick={handleNew}
          class="w-full bg-terminal-green text-soft-black font-bold py-2 px-4 rounded-lg border-2 border-green-700 hover:bg-green-400 transition-colors"
        >
          ➕ New Conversation
        </button>
      </div>

      {/* Conversation List */}
      <div class="flex-1 overflow-y-auto p-3 space-y-2">
        {conversations.value.length === 0 ? (
          <p class="text-sm text-gray-500 text-center py-8">
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
                class={`p-3 rounded-lg border-2 transition-all ${
                  isActive
                    ? "bg-purple-100 border-purple-400 shadow-md"
                    : "bg-gray-50 border-gray-300 hover:border-purple-300 hover:bg-purple-50"
                }`}
              >
                <div class="flex items-start justify-between gap-2">
                  <button
                    onClick={() => handleLoad(conv.id)}
                    class="flex-1 text-left"
                  >
                    <h3 class="font-semibold text-sm text-gray-800 truncate">
                      {truncatedTitle}
                    </h3>
                    <div class="flex items-center gap-2 mt-1 text-xs text-gray-600">
                      <span>📊 {conv.nodes.length} topics</span>
                      <span>•</span>
                      <span>✅ {conv.actionItems.length} items</span>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                  </button>

                  <button
                    onClick={() => handleDelete(conv.id)}
                    class="text-red-500 hover:text-red-700 p-1"
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
          <div class="bg-white rounded-lg border-4 border-red-400 shadow-brutal p-6 max-w-sm mx-4">
            <h3 class="text-xl font-bold mb-3">🗑️ Delete Conversation?</h3>
            <p class="text-sm text-gray-700 mb-6">
              This will permanently delete this conversation and all its data.
              This action cannot be undone.
            </p>
            <div class="flex gap-2">
              <button
                onClick={confirmDelete}
                class="flex-1 bg-red-500 text-white font-bold py-2 px-4 rounded border-2 border-red-700 hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                class="flex-1 bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded border-2 border-gray-400 hover:bg-gray-300"
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
