/**
 * Home Island - Main Layout with Conditional Visibility
 *
 * Shows upload panel + sidebar when NO data
 * Shows only dashboard when data exists
 */

import { signal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { conversationData } from "../signals/conversationStore.ts";
import { getActiveConversationId, loadConversation } from "../core/storage/localStorage.ts";
import UploadIsland from "./UploadIsland.tsx";
import DashboardIsland from "./DashboardIsland.tsx";
import ConversationList from "./ConversationList.tsx";
import MobileHistoryMenu from "./MobileHistoryMenu.tsx";
import ShareButton from "./ShareButton.tsx";
import MarkdownMakerDrawer from "./MarkdownMakerDrawer.tsx";
import AudioRecorder from "./AudioRecorder.tsx";

const drawerOpen = signal(false);

export default function HomeIsland() {
  // Restore last conversation on mount
  useEffect(() => {
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

  const heroLines = ["See what you're", 'really saying'];

  return (
    <div class="mapper-scene min-h-screen">
      {/* Top Bar - Brand presence */}
      <header style={{
        background: 'var(--surface-glass-warm)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '2px solid var(--border-cream-medium)',
        boxShadow: 'var(--shadow-md)',
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 w-full" style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%'
        }}>
          {conversationData.value ? (
            // Conversation header - clean and slim
            <>
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={() => {
                    conversationData.value = null;
                    window.history.pushState({}, '', '/');
                  }}
                  class="btn btn-ghost btn-xs flex-shrink-0 flex items-center justify-center w-9 h-9"
                  title="Back to home"
                >
                  <i class="fa fa-arrow-left" style={{ fontSize: '14px', color: 'var(--color-text)' }}></i>
                </button>
                <h1
                  class="truncate"
                  style={{
                    fontSize: '22px',
                    fontWeight: '800',
                    color: 'var(--soft-black)', /* use unified soft-black */
                    letterSpacing: '-0.03em'
                  }}
                >
                  {conversationData.value.conversation.title}
                </h1>
              </div>
              <div class="flex items-center gap-2">
                {/* Audio Recorder - NEW! */}
                <AudioRecorder
                  conversationId={conversationData.value.conversation.id || ''}
                />

                {/* Export button */}
                <button
                  onClick={() => drawerOpen.value = !drawerOpen.value}
                  class="btn btn-sm hidden sm:block"
                  style={{
                    background: 'var(--soft-black)',
                    color: 'white',
                    borderColor: 'var(--soft-black)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--soft-brown)';
                    e.currentTarget.style.borderColor = 'var(--soft-brown)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--soft-black)';
                    e.currentTarget.style.borderColor = 'var(--soft-black)';
                  }}
                  title="Export"
                >
                  Export
                </button>

                {/* Share button */}
                <ShareButton />
              </div>
            </>
          ) : (
            // Default header - app name and theme shuffler
            <>
              <a
                href="/"
                style={{
                  fontSize: '22px',
                  fontWeight: '800',
                  color: 'var(--soft-black)', /* use unified soft-black */
                  letterSpacing: '-0.03em',
                  flex: 1,
                  textDecoration: 'none',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                  display: 'inline-block',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(var(--color-accent-rgb), 0.08)';
                  e.currentTarget.style.transform = 'translateX(2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                Conversation Mapper
              </a>
            </>
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

      {/* Main Layout - No sidebar, centered content */}
      <div class="flex" style={{ minHeight: 'calc(100vh - 80px)' }}>
        {/* Mobile History Menu - Only show when NO data */}
        {!conversationData.value && <MobileHistoryMenu />}

        {/* Content Area - Full width, centered */}
        <main class="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8">
          <div class="max-w-7xl mx-auto grid gap-4 sm:gap-6">
            {/* Hero Section - Only show when NO data */}
            {!conversationData.value && (
              <section class="mapper-stage">
                <div class="mapper-card" data-tilt>
                  <div class="mapper-card__inner">
                    <div class="mapper-hero-copy">
                      <div>
                        <div class="mapper-eyebrow">Welcome to Conversation Mapper</div>
                        <h1 class="mapper-hero-title">
                          {heroLines.map((line, lineIndex) => (
                            <span
                              class="mapper-hero-line"
                              key={line}
                              style={{ animationDelay: `${lineIndex * 140}ms` }}
                            >
                              {line}
                            </span>
                          ))}
                        </h1>
                      </div>
                      <p class="mapper-hero-desc">
                        Build a confident map for every conversation—stable layout, playful controls,
                        no resizing jump scares when you switch modes.
                      </p>
                      <p class="mapper-hero-caption">
                        Record / Paste / Upload — same module, same rhythm.
                      </p>
                    </div>
                    <div class="mapper-card__panel">
                      <UploadIsland />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Dashboard - Always rendered, shows its own empty state */}
            {conversationData.value && (
              <section style={{ paddingTop: 'clamp(1rem, 3vh, 2rem)' }}>
                <DashboardIsland />
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
