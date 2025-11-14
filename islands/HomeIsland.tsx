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
              <a
                href="/"
                style={{
                  fontSize: '22px',
                  fontWeight: '800',
                  color: '#0A0A0A',
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
                  e.currentTarget.style.background = 'rgba(var(--color-accent), 0.08)';
                  e.currentTarget.style.transform = 'translateX(2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                Conversation Mapper
              </a>
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
                {/* Hero Card - SoftStack billboard with SOUL */}
                <div style={{
                  width: '100%',
                  maxWidth: '820px',
                  background: 'rgba(255, 250, 245, 0.88)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '2px solid rgba(255, 200, 170, 0.3)',
                  borderRadius: '20px',
                  boxShadow: '0 24px 80px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.5) inset',
                  padding: 'clamp(3.5rem, 8vw, 5rem) clamp(2.5rem, 6vw, 4.5rem)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.4s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 32px 100px rgba(0, 0, 0, 0.08), 0 0 0 2px rgba(var(--color-accent), 0.2) inset, 0 0 40px rgba(var(--color-accent), 0.15)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 24px 80px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.5) inset';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                  {/* Warm gradient wash - more personality */}
                  <div style={{
                    position: 'absolute',
                    top: '-15%',
                    left: '-8%',
                    right: '-8%',
                    height: '60%',
                    background: 'radial-gradient(ellipse 120% 80% at 45% 0%, rgba(255, 210, 180, 0.35) 0%, rgba(255, 230, 200, 0.18) 40%, transparent 70%)',
                    pointerEvents: 'none',
                    zIndex: 0
                  }}></div>

                  {/* Content wrapper */}
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Card Header - LEFT ALIGNED, proper hierarchy */}
                    <div style={{ marginBottom: '3rem' }}>
                      {/* Eyebrow - what this is */}
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'var(--color-accent)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginBottom: '1rem'
                      }}>
                        AI-Powered Analysis
                      </div>

                      {/* Main Headline - BIG and left-aligned */}
                      <h1 style={{
                        fontSize: 'clamp(2.75rem, 7vw, 4rem)',
                        fontWeight: '900',
                        color: '#0A0A0A',
                        letterSpacing: '-0.045em',
                        marginBottom: '1.25rem',
                        lineHeight: '1',
                        maxWidth: '600px'
                      }}>
                        Turn conversations into insights
                      </h1>

                      {/* Subheading - clear value prop */}
                      <p style={{
                        fontSize: 'clamp(18px, 2.2vw, 21px)',
                        color: '#3A3A3A',
                        fontWeight: '500',
                        lineHeight: '1.5',
                        maxWidth: '520px',
                        marginBottom: '0.75rem',
                        letterSpacing: '-0.01em'
                      }}>
                        Record, paste, or upload any conversation. Get instant summaries, action items, and topic maps.
                      </p>

                      {/* Supporting copy */}
                      <p style={{
                        fontSize: '15px',
                        color: '#666',
                        fontWeight: '400',
                        lineHeight: '1.6',
                        maxWidth: '480px'
                      }}>
                        No signup required. Everything stays private in your browser.
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
