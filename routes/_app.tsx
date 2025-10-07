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
        <Component />
      </body>
    </html>
  );
}
