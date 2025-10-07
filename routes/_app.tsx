import { type PageProps } from "$fresh/server.ts";

export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Conversation Mapper</title>
        <link rel="stylesheet" href="/styles.css" />

        {/* Initialize theme from localStorage before render */}
        <script dangerouslySetInnerHTML={{
          __html: `
            try {
              const stored = localStorage.getItem('conversation-mapper-theme');
              if (stored) {
                const theme = JSON.parse(stored);
                Object.entries(theme.cssVars || {}).forEach(([key, value]) => {
                  document.documentElement.style.setProperty(key, value);
                });
                // Set main theme vars
                if (theme.base) document.documentElement.style.setProperty('--color-base', theme.base);
                if (theme.secondary) document.documentElement.style.setProperty('--color-secondary', theme.secondary);
                if (theme.accent) document.documentElement.style.setProperty('--color-accent', theme.accent);
                if (theme.text) document.documentElement.style.setProperty('--color-text', theme.text);
                if (theme.textSecondary) document.documentElement.style.setProperty('--color-text-secondary', theme.textSecondary);
                if (theme.border) document.documentElement.style.setProperty('--color-border', theme.border);
              }
            } catch (e) {
              console.error('Error setting initial theme:', e);
            }
          `
        }} />
      </head>
      <body>
        {/* Film grain effect overlay */}
        <div
          id="grain-layer"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 9999,
            opacity: 0.08,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            mixBlendMode: "overlay",
          }}
        />

        {/* Scanline effect overlay */}
        <div
          id="scan-layer"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 10000,
            opacity: 0.03,
            background: `repeating-linear-gradient(
              0deg,
              rgba(0, 0, 0, 0.15),
              rgba(0, 0, 0, 0.15) 1px,
              transparent 1px,
              transparent 2px
            )`,
          }}
        />

        <Component />
      </body>
    </html>
  );
}
