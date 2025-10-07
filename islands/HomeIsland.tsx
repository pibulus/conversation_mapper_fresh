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
import JuicyThemes from "../components/JuicyThemes.tsx";

const drawerOpen = signal(false);

export default function HomeIsland() {
  // Get transcript for MarkdownMaker
  const transcript = conversationData.value?.transcript?.text || '';

  return (
    <div class="min-h-screen" style={{ background: 'var(--color-base)' }}>
      {/* Header - Dynamic based on conversation state */}
      <header style={{
        borderBottom: `var(--border-width) solid var(--color-border)`,
        background: 'var(--color-secondary)',
        boxShadow: 'var(--shadow-soft)'
      }}>
        <div class="max-w-7xl mx-auto px-6 py-4">
          {conversationData.value ? (
            // Conversation-specific header with title + utilities
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <h1
                  class="truncate cursor-pointer hover:opacity-80"
                  style={{
                    fontSize: 'calc(var(--heading-size) * 1.6)',
                    fontWeight: 'var(--heading-weight)',
                    color: 'var(--color-accent)',
                    transition: 'var(--transition-fast)'
                  }}
                  onClick={() => {
                    conversationData.value = null;
                    window.history.pushState({}, '', '/');
                  }}
                  title="Back to home"
                >
                  {conversationData.value.conversation.title}
                </h1>
                <p class="mt-1" style={{
                  fontSize: 'var(--tiny-size)',
                  color: 'var(--color-text-secondary)'
                }}>
                  {conversationData.value.conversation.source === 'audio' ? '🎤 Audio' : '📝 Text'} • {
                    conversationData.value.conversation.created_at
                      ? new Date(conversationData.value.conversation.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : 'Unknown date'
                  }
                </p>
              </div>
              <div class="flex gap-2 ml-4">
                {/* Theme selector */}
                <JuicyThemes
                  storageKey="conversation-mapper-theme"
                  showRandom={true}
                  showVintageControls={true}
                  position="right"
                />

                {/* Audio indicator */}
                {conversationData.value.conversation.source === 'audio' && (
                  <button class="px-4 py-2 rounded flex items-center gap-2" style={{
                    background: 'var(--color-accent)',
                    border: `2px solid var(--color-border)`,
                    color: 'white',
                    fontWeight: '600',
                    fontSize: 'var(--text-size)',
                    transition: 'var(--transition-fast)'
                  }}>
                    🎤 Audio
                  </button>
                )}
                {/* Markdown Maker Drawer Toggle */}
                <button
                  onClick={() => drawerOpen.value = !drawerOpen.value}
                  class="px-4 py-2 rounded flex items-center gap-2"
                  style={{
                    background: 'var(--color-accent)',
                    border: `2px solid var(--color-border)`,
                    color: 'white',
                    fontWeight: '600',
                    fontSize: 'var(--text-size)',
                    transition: 'var(--transition-fast)'
                  }}
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
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div style={{
                  fontSize: '3.5rem',
                  lineHeight: 1,
                  filter: 'drop-shadow(2px 2px 0 rgba(0,0,0,0.1))'
                }}>🧠</div>
                <div>
                  <h1 style={{
                    fontSize: 'calc(var(--heading-size) * 2.2)',
                    fontWeight: '800',
                    color: 'var(--color-accent)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1
                  }}>
                    Conversation Mapper
                  </h1>
                  <p class="mt-1" style={{
                    fontSize: 'calc(var(--text-size) * 1.1)',
                    color: 'var(--color-text-secondary)',
                    fontWeight: '500'
                  }}>
                    Meeting transcripts that make sense
                  </p>
                </div>
              </div>
              <JuicyThemes
                storageKey="conversation-mapper-theme"
                showRandom={true}
                showVintageControls={true}
                position="right"
              />
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
              <section class="rounded-lg p-6" style={{
                background: 'var(--color-secondary)',
                border: `var(--border-width) solid var(--color-border)`,
                boxShadow: 'var(--shadow-soft)'
              }}>
                <h2 class="mb-4" style={{
                  fontSize: 'calc(var(--heading-size) * 1.4)',
                  fontWeight: 'var(--heading-weight)',
                  color: 'var(--color-accent)'
                }}>
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
