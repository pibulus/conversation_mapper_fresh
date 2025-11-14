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
              <div style={{
                minHeight: 'max(650px, 75vh)',
                paddingTop: 'clamp(3rem, 8vh, 5rem)',
                paddingBottom: 'clamp(2rem, 6vh, 4rem)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Split Hero - Left message / Right action */}
                <div style={{
                  width: '100%',
                  maxWidth: '1100px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: 'clamp(2rem, 5vw, 4rem)',
                  alignItems: 'center'
                }}>
                  {/* LEFT: Billboard Message */}
                  <div style={{ padding: '0 1rem' }}>
                    {/* Big Bold Headline */}
                    <h1 style={{
                      fontSize: 'clamp(2.75rem, 6.5vw, 4.5rem)',
                      fontWeight: '900',
                      color: '#0A0A0A',
                      letterSpacing: '-0.05em',
                      lineHeight: '0.95',
                      marginBottom: '1.5rem',
                      maxWidth: '520px'
                    }}>
                      See what you're really saying
                    </h1>

                    {/* Value Prop */}
                    <p style={{
                      fontSize: 'clamp(18px, 2.2vw, 22px)',
                      color: '#3A3A3A',
                      fontWeight: '500',
                      lineHeight: '1.5',
                      marginBottom: '1.25rem',
                      maxWidth: '480px',
                      letterSpacing: '-0.01em'
                    }}>
                      Turn messy conversations into maps that make sense.
                    </p>

                    {/* Supporting Details */}
                    <p style={{
                      fontSize: '16px',
                      color: '#666',
                      fontWeight: '400',
                      lineHeight: '1.65',
                      maxWidth: '440px'
                    }}>
                      Record, paste, or upload—everything stays in your browser.
                    </p>
                  </div>

                  {/* RIGHT: Action Card */}
                  <div>
                    <div style={{
                      background: 'rgba(255, 250, 245, 0.78)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '1.5px solid rgba(0, 0, 0, 0.12)',
                      borderRadius: '20px',
                      boxShadow: '6px 6px 0 0 rgba(0, 0, 0, 0.06), 0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
                      padding: 'clamp(2rem, 4vw, 3rem)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '8px 8px 0 0 rgba(0, 0, 0, 0.08), 0 16px 48px rgba(0, 0, 0, 0.12), inset 0 0 0 1.5px rgba(var(--color-accent), 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.9)';
                      e.currentTarget.style.transform = 'translateY(-3px) translateX(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '6px 6px 0 0 rgba(0, 0, 0, 0.06), 0 12px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.7)';
                      e.currentTarget.style.transform = 'translateY(0) translateX(0)';
                    }}
                    >
                      {/* Subtle noise texture overlay for micro-texture */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
                        opacity: 0.5,
                        pointerEvents: 'none',
                        zIndex: 0,
                        mixBlendMode: 'overlay'
                      }}></div>

                      {/* Warm cream glow */}
                      <div style={{
                        position: 'absolute',
                        top: '-15%',
                        left: '-5%',
                        right: '-5%',
                        height: '60%',
                        background: 'radial-gradient(ellipse 100% 65% at 50% 0%, rgba(255, 235, 215, 0.35) 0%, rgba(255, 245, 230, 0.15) 50%, transparent 75%)',
                        pointerEvents: 'none',
                        zIndex: 1
                      }}></div>

                      <div style={{ position: 'relative', zIndex: 2 }}>
                        <UploadIsland />
                      </div>
                    </div>
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
