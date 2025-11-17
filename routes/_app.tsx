import { type PageProps } from "$fresh/server.ts";

export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Primary Meta Tags */}
        <title>Conversation Mapper - Turn talk into action</title>
        <meta name="title" content="Conversation Mapper - Turn talk into action" />
        <meta name="description" content="Drop a conversation. Watch it bloom. Record, transcribe, and map messy talks into clean topics and action items. Private. Simple. Yours." />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://conversationmapper.com/" />
        <meta property="og:title" content="Conversation Mapper - Turn talk into action" />
        <meta property="og:description" content="Drop a conversation. Watch it bloom. Record, transcribe, and map messy talks into clean topics and action items." />
        <meta property="og:image" content="/og-image-share.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://conversationmapper.com/" />
        <meta property="twitter:title" content="Conversation Mapper - Turn talk into action" />
        <meta property="twitter:description" content="Drop a conversation. Watch it bloom. Record, transcribe, and map messy talks into clean topics and action items." />
        <meta property="twitter:image" content="/og-image-share.png" />

        {/* Favicon */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://conversationmapper.com/" />

        {/* Theme Color */}
        <meta name="theme-color" content="#FFE5EC" />

        {/* Mobile Web App Capable */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ConvoMap" />

        {/* Styles */}
        <link rel="stylesheet" href="/styles.css" />

        {/* Structured Data (JSON-LD) */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Conversation Mapper",
            "description": "Drop a conversation. Watch it bloom. Record, transcribe, and map messy talks into clean topics and action items. Private. Simple. Yours.",
            "url": "https://conversationmapper.com",
            "applicationCategory": "ProductivityApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "Audio recording and transcription",
              "Conversation topic extraction",
              "Action item tracking",
              "Visual conversation mapping",
              "Shareable conversation links",
              "Offline-first storage"
            ],
            "browserRequirements": "Requires JavaScript. Works best with modern browsers.",
            "softwareVersion": "1.0",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "5",
              "ratingCount": "1"
            }
          })
        }} />

        {/* Initialize theme from localStorage before render */}
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              const stored = localStorage.getItem('conversation-mapper-theme');
              if (stored) {
                const theme = JSON.parse(stored);
                // Apply all theme variables (OKLCH colors + gradient)
                Object.entries(theme).forEach(([key, value]) => {
                  if (key.startsWith('--color-') || key === '--gradient-bg') {
                    document.documentElement.style.setProperty(key, value);
                  }
                });
              }
            } catch (e) {
              console.error('Error setting initial theme:', e);
            }
          `
        }} />

        {/* Service Worker Registration for PWA */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then(reg => console.log('Service Worker registered:', reg.scope))
                  .catch(err => console.error('Service Worker registration failed:', err));
              });
            }
          `
        }} />
      </head>
      <body>
        <div class="scroll-progress" aria-hidden="true"></div>
        <Component />
      </body>
    </html>
  );
}
