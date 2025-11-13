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
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
