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
      {/* Top Bar - Brand presence */}
      <header style={{
        background: 'rgba(255, 250, 245, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '2px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
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
                    fontSize: '22px',
                    fontWeight: '800',
                    color: '#0A0A0A',
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
                fontSize: '22px',
                fontWeight: '800',
                color: '#0A0A0A',
                letterSpacing: '-0.03em',
                flex: 1,
                textTransform: 'none'
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
      <div class="flex" style={{ minHeight: 'calc(100vh - 80px)' }}>
        {/* Mobile History Menu - Only show when NO data */}
        {!conversationData.value && <MobileHistoryMenu />}

        {/* Content Area - Full width, centered */}
        <main class="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8">
          <div class="max-w-7xl mx-auto grid gap-4 sm:gap-6">
            {/* Hero Section - Only show when NO data */}
            {!conversationData.value && (
              <div class="flex flex-col items-center justify-center" style={{
                minHeight: 'max(650px, 75vh)',
                paddingTop: 'clamp(5rem, 12vh, 8rem)',
                paddingBottom: 'clamp(2rem, 6vh, 4rem)'
              }}>
                {/* Hero Card - SoftStack billboard */}
                <div style={{
                  width: '100%',
                  maxWidth: '780px',
                  background: 'rgba(255, 250, 245, 0.95)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 215, 180, 0.4)',
                  borderRadius: '18px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08), 0 8px 20px rgba(0, 0, 0, 0.04)',
                  padding: 'clamp(3.5rem, 8vw, 5.5rem) clamp(2.5rem, 6vw, 4rem)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Subtle inner gradient - warm atmosphere */}
                  <div style={{
                    position: 'absolute',
                    top: '-20%',
                    left: '-10%',
                    right: '-10%',
                    height: '70%',
                    background: 'radial-gradient(ellipse 130% 90% at 50% 0%, rgba(255, 225, 200, 0.25) 0%, rgba(255, 240, 220, 0.12) 50%, transparent 75%)',
                    pointerEvents: 'none',
                    zIndex: 0
                  }}></div>

                  {/* Content wrapper */}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Card Header - Clean hierarchy */}
                    <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                      <h2 style={{
                        fontSize: 'clamp(2.5rem, 6.5vw, 3.25rem)',
                        fontWeight: '800',
                        color: '#0A0A0A',
                        letterSpacing: '-0.04em',
                        marginBottom: '1.75rem',
                        lineHeight: '1.05',
                        maxWidth: '550px',
                        margin: '0 auto 1.75rem'
                      }}>
                        See what you're really saying
                      </h2>
                      <p style={{
                        fontSize: 'clamp(17px, 2vw, 19px)',
                        color: '#4A4A4A',
                        fontWeight: '500',
                        lineHeight: '1.65',
                        maxWidth: '480px',
                        margin: '0 auto',
                        letterSpacing: '-0.005em'
                      }}>
                        Drop text or audio. Watch the insights appear.<br/>
                        Map conversations. Capture clarity.
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
