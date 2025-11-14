/**
 * Home Island - Main Layout with Conditional Visibility
 *
 * Shows upload panel + sidebar when NO data
 * Shows only dashboard when data exists
 */

import { signal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { conversationData } from "../signals/conversationStore.ts";
import { initializeTheme } from "../services/themeStore.ts";
import { getActiveConversationId, loadConversation } from "../core/storage/localStorage.ts";
import UploadIsland from "./UploadIsland.tsx";
import DashboardIsland from "./DashboardIsland.tsx";
import ConversationList from "./ConversationList.tsx";
import MobileHistoryMenu from "./MobileHistoryMenu.tsx";
import ShareButton from "./ShareButton.tsx";
import MarkdownMakerDrawer from "./MarkdownMakerDrawer.tsx";
import AudioRecorder from "./AudioRecorder.tsx";
import ThemeShuffler from "./ThemeShuffler.tsx";

const drawerOpen = signal(false);

export default function HomeIsland() {
  // Initialize theme + restore last conversation on mount
  useEffect(() => {
    initializeTheme();

    // Auto-restore last active conversation from localStorage
    const activeId = getActiveConversationId();
    if (activeId && !conversationData.value) {
      const stored = loadConversation(activeId);
      if (stored) {
        conversationData.value = stored;
        console.log('✅ Restored conversation from localStorage:', stored.conversation.title || activeId);
      }
    }
  }, []);

  // Get transcript for MarkdownMaker
  const transcript = conversationData.value?.transcript?.text || '';

  return (
    <div class="min-h-screen" style={{ background: 'var(--gradient-bg)' }}>
      {/* Header - Dynamic based on conversation state */}
      <header class="glass" style={{
        borderBottom: `var(--border-width) solid var(--color-border)`,
        boxShadow: 'var(--shadow-lifted)'
      }}>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          {conversationData.value ? (
            // Conversation-specific header with title + utilities
            <div class="flex items-center justify-between gap-3 sm:gap-4">
              <div class="flex-1 min-w-0">
                {/* Title with back button */}
                <div class="flex items-center gap-2 sm:gap-3 mb-1">
                  <button
                    onClick={() => {
                      conversationData.value = null;
                      window.history.pushState({}, '', '/');
                    }}
                    class="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-white/10 transition-all"
                    style={{
                      border: `2px solid var(--color-border)`,
                      color: 'var(--color-accent)'
                    }}
                    title="Back to home"
                  >
                    <i class="fa fa-arrow-left text-xs sm:text-sm"></i>
                  </button>
                  <h1
                    class="truncate"
                    style={{
                      fontSize: 'clamp(1.25rem, 4vw, calc(var(--heading-size) * 1.8))',
                      fontWeight: '700',
                      color: 'var(--color-text)',
                      lineHeight: '1.2',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {conversationData.value.conversation.title}
                  </h1>
                </div>
                {/* Metadata row */}
                <div class="flex flex-wrap items-center gap-2 sm:gap-3 pl-10 sm:pl-12" style={{
                  fontSize: 'clamp(0.6875rem, 2vw, var(--tiny-size))',
                  color: 'var(--color-text-secondary)'
                }}>
                  <span class="flex items-center gap-1.5 whitespace-nowrap">
                    <i class={conversationData.value.conversation.source === 'audio' ? 'fa fa-microphone' : 'fa fa-file-text-o'}></i>
                    <span class="hidden xs:inline">{conversationData.value.conversation.source === 'audio' ? 'Audio' : 'Text'}</span>
                  </span>
                  <span class="hidden xs:inline">•</span>
                  <span class="flex items-center gap-1.5 whitespace-nowrap">
                    <i class="fa fa-calendar-o"></i>
                    <span class="hidden sm:inline">
                      {conversationData.value.conversation.created_at
                        ? new Date(conversationData.value.conversation.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : 'Unknown date'
                      }
                    </span>
                  </span>
                  <span class="hidden sm:inline">•</span>
                  <span class="flex items-center gap-1.5 whitespace-nowrap">
                    <i class="fa fa-hashtag"></i>
                    {conversationData.value.nodes.length}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-1.5 sm:gap-2">
                {/* Audio Recorder - NEW! */}
                <AudioRecorder
                  conversationId={conversationData.value.conversation.id || ''}
                />

                {/* Markdown Maker Drawer Toggle */}
                <button
                  onClick={() => drawerOpen.value = !drawerOpen.value}
                  class="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg hover:brightness-110 transition-all"
                  style={{
                    background: 'var(--color-accent)',
                    border: `2px solid var(--color-border)`,
                    color: 'white',
                    fontWeight: '600',
                    fontSize: 'clamp(0.875rem, 2vw, var(--text-size))',
                    boxShadow: 'var(--shadow-soft)'
                  }}
                  title="Export"
                >
                  <i class={drawerOpen.value ? "fa fa-times" : "fa fa-bars"}></i>
                  <span class="hidden sm:inline">Export</span>
                </button>

                {/* Share button */}
                <ShareButton />

                {/* Theme shuffler */}
                <ThemeShuffler />
              </div>
            </div>
          ) : (
            // Default header when no conversation loaded
            <div class="flex items-center justify-between gap-4">
              <div class="flex-1 text-center">
                <div style={{
                  fontSize: 'clamp(5rem, 12vw, 8rem)',
                  marginBottom: '1rem',
                  lineHeight: 1
                }}>
                  🧠
                </div>
                <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4" style={{
                  color: 'var(--color-text)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1
                }}>
                  Conversation Mapper
                </h1>
                <p class="text-xl md:text-2xl font-bold mb-2" style={{
                  color: 'var(--color-accent)',
                  lineHeight: 1.3
                }}>
                  Talk. Map. Track.
                </p>
                <p class="text-base md:text-lg max-w-lg mx-auto" style={{
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.5
                }}>
                  Messy conversations become clear action
                </p>
              </div>
              <div class="absolute right-4 top-4">
                <ThemeShuffler />
              </div>
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
        <main class="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div class="max-w-7xl mx-auto grid gap-4 sm:gap-6">
            {/* Upload Section - Only show when NO data */}
            {!conversationData.value && (
              <section class="glass-strong p-8 max-w-2xl mx-auto mt-8" style={{
                borderRadius: 'var(--border-radius-xl)',
                boxShadow: 'var(--shadow-xl)'
              }}>
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
