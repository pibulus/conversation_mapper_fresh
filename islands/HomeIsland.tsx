/**
 * Home Island - Main Layout with Conditional Visibility
 *
 * Shows upload panel + sidebar when NO data
 * Shows only dashboard when data exists
 */

import { signal } from "@preact/signals";
import { conversationData } from "../signals/conversationStore.ts";
import UploadIsland from "./UploadIsland.tsx";
import DashboardIsland from "./DashboardIsland.tsx";
import ConversationList from "./ConversationList.tsx";
import MobileHistoryMenu from "./MobileHistoryMenu.tsx";
import ShareButton from "./ShareButton.tsx";
import MarkdownMakerDrawer from "./MarkdownMakerDrawer.tsx";

const drawerOpen = signal(false);

export default function HomeIsland() {
  // Get transcript for MarkdownMaker
  const transcript = conversationData.value?.transcript?.text || '';

  return (
    <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header - Dynamic based on conversation state */}
      <header class="border-b-4 border-purple-400 bg-white shadow-lg">
        <div class="max-w-7xl mx-auto px-6 py-4">
          {conversationData.value ? (
            // Conversation-specific header with title + utilities
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <h1 class="text-2xl font-bold text-purple-600 truncate">
                  {conversationData.value.conversation.title}
                </h1>
                <p class="text-xs text-gray-500 mt-1">
                  {conversationData.value.conversation.source === 'audio' ? '🎤 Audio' : '📝 Text'} • {new Date(conversationData.value.conversation.created_at).toLocaleDateString()}
                </p>
              </div>
              <div class="flex gap-2 ml-4">
                {/* Audio indicator */}
                {conversationData.value.conversation.source === 'audio' && (
                  <button class="px-4 py-2 bg-amber border-2 border-yellow-700 rounded hover:bg-yellow-400 transition-colors flex items-center gap-2 font-semibold text-sm">
                    🎤 Audio
                  </button>
                )}
                {/* Markdown Maker Drawer Toggle */}
                <button
                  onClick={() => drawerOpen.value = !drawerOpen.value}
                  class="px-4 py-2 bg-soft-purple border-2 border-purple-600 rounded hover:bg-purple-500 transition-colors flex items-center gap-2 font-semibold text-sm text-white"
                  title="Toggle Markdown Maker"
                >
                  {drawerOpen.value ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 6h16M4 12h16m-7 6h7"
                      />
                    </svg>
                  )}
                </button>
                {/* Share button */}
                <div>
                  <ShareButton />
                </div>
              </div>
            </div>
          ) : (
            // Default header when no conversation loaded
            <div>
              <h1 class="text-3xl font-bold text-purple-600">
                🧠 Conversation Mapper
              </h1>
              <p class="text-sm text-gray-600 mt-1">
                Meeting transcripts that make sense
              </p>
            </div>
          )}
        </div>
      </header>

      {/* MarkdownMaker Drawer */}
      {conversationData.value && (
        <MarkdownMakerDrawer
          isOpen={drawerOpen.value}
          onClose={() => drawerOpen.value = false}
          transcript={transcript}
          conversationId={conversationData.value.conversation.id}
        />
      )}

      {/* Main Layout with Conditional Sidebar */}
      <div class="flex h-[calc(100vh-88px)]">
        {/* Left Sidebar - Only show when NO data (hidden on mobile) */}
        {!conversationData.value && (
          <aside class="hidden md:block w-80 flex-shrink-0 overflow-hidden">
            <ConversationList />
          </aside>
        )}

        {/* Mobile History Menu - Only show when NO data */}
        {!conversationData.value && <MobileHistoryMenu />}

        {/* Right Content Area */}
        <main class="flex-1 overflow-y-auto px-4 md:px-6 py-8">
          <div class="max-w-6xl mx-auto grid gap-6">
            {/* Upload Section - Only show when NO data */}
            {!conversationData.value && (
              <section class="bg-white rounded-lg border-4 border-pink-300 shadow-lg p-6">
                <h2 class="text-xl font-bold text-pink-600 mb-4">
                  📤 Upload Conversation
                </h2>
                <UploadIsland />
              </section>
            )}

            {/* Dashboard - Always rendered, shows its own empty state */}
            <section>
              <DashboardIsland />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
