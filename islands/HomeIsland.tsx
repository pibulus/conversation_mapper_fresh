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
      {/* Top Bar - Anchored with theme integration */}
      <header style={{
        background: 'rgba(255, 252, 248, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '2px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        height: '72px',
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
                  class="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg hover:bg-black/5 transition-all"
                  style={{
                    border: '1px solid rgba(0, 0, 0, 0.1)'
                  }}
                  title="Back to home"
                >
                  <i class="fa fa-arrow-left" style={{ fontSize: '14px', color: '#2C2C2C' }}></i>
                </button>
                <h1
                  class="truncate"
                  style={{
                    fontSize: '19px',
                    fontWeight: '700',
                    color: '#1A1A1A',
                    letterSpacing: '-0.02em'
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
                  class="px-3 py-1.5 rounded-lg transition-all hidden sm:block"
                  style={{
                    background: '#1A1A1A',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#2C2C2C';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#1A1A1A';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="Export"
                >
                  Export
                </button>

                {/* Share button */}
                <ShareButton />

                {/* Theme shuffler */}
                <ThemeShuffler />
              </div>
            </>
          ) : (
            // Default header - app name and theme shuffler
            <>
              <h1 style={{
                fontSize: '19px',
                fontWeight: '700',
                color: '#1A1A1A',
                letterSpacing: '-0.02em',
                flex: 1
              }}>
                Conversation Mapper
              </h1>
              <ThemeShuffler />
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
      <div class="flex" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Mobile History Menu - Only show when NO data */}
        {!conversationData.value && <MobileHistoryMenu />}

        {/* Content Area - Full width, centered */}
        <main class="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8">
          <div class="max-w-7xl mx-auto grid gap-4 sm:gap-6">
            {/* Hero Section - Only show when NO data */}
            {!conversationData.value && (
              <div class="flex flex-col items-center justify-center" style={{
                minHeight: 'max(550px, 65vh)',
                paddingTop: 'clamp(4rem, 10vh, 6rem)',
                paddingBottom: 'clamp(3rem, 8vh, 5rem)'
              }}>
                {/* Hero Card - Intentional structure with personality */}
                <div style={{
                  width: '100%',
                  maxWidth: '680px',
                  background: 'rgba(255, 252, 248, 0.85)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '2px solid rgba(0, 0, 0, 0.12)',
                  borderRadius: '20px',
                  boxShadow: '6px 6px 0 0 rgba(0, 0, 0, 0.06), 0 4px 20px rgba(0, 0, 0, 0.08)',
                  padding: 'clamp(2.5rem, 6vw, 4rem)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Accent wash - subtle pastel flavor */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(255, 230, 220, 0.3) 0%, rgba(255, 240, 245, 0.2) 50%, transparent 100%)',
                    pointerEvents: 'none',
                    zIndex: 0
                  }}></div>

                  {/* Content wrapper */}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Card Header - Spunky copy! */}
                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                      <h2 style={{
                        fontSize: 'clamp(2rem, 5vw, 2.75rem)',
                        fontWeight: '800',
                        color: '#1A1A1A',
                        letterSpacing: '-0.04em',
                        marginBottom: '1rem',
                        lineHeight: '1.1'
                      }}>
                        Let's map your conversation
                      </h2>
                      <p style={{
                        fontSize: 'clamp(17px, 2vw, 19px)',
                        color: '#4A4A4A',
                        fontWeight: '500',
                        lineHeight: '1.7',
                        maxWidth: '480px',
                        margin: '0 auto'
                      }}>
                        Drop your thoughts, paste your chats, or just hit record.
                      </p>
                      <p style={{
                        fontSize: '16px',
                        color: '#8B7F77',
                        fontWeight: '400',
                        lineHeight: '1.6',
                        marginTop: '0.75rem'
                      }}>
                        We'll turn the chaos into clarity
                      </p>
                    </div>

                    {/* Upload Controls */}
                    <UploadIsland />
                  </div>
                </div>
              </div>
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
