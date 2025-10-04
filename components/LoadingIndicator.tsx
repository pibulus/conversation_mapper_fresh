/**
 * LoadingIndicator Component
 *
 * Beautiful loading screen with wavy bouncing text and random emoji
 * Ported from Svelte conversation_mapper version
 */

import { useEffect, useState } from "preact/hooks";

// Chill, vibey loading messages
function getRandomLoadingMessage() {
  const messages = [
    "loading your vibe...",
    "syncing the wavelengths...",
    "tuning the frequencies...",
    "assembling your dashboard...",
    "connecting the dots...",
    "setting the mood...",
    "capturing conversations..."
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Modern, chill vibes emoji sets
function getLoadingEmoji() {
  const emojis = ["🪩", "✨", "💫", "🔮", "💎", "🌟", "🌊", "⚡"];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

export default function LoadingIndicator() {
  const [loadingMessage] = useState(getRandomLoadingMessage());
  const [loadingEmoji] = useState(getLoadingEmoji());

  useEffect(() => {
    console.log('LoadingIndicator mounted');
  }, []);

  return (
    <div class="loading-indicator">
      <div class="loading-container glass">
        <div class="loading-box">
          <div class="emoji-row">
            <span class="emoji pulse">{loadingEmoji}</span>
          </div>
          <div class="loading-text">
            {loadingMessage.split('').map((letter, i) => (
              <span
                key={i}
                class="bounce-letter"
                style={`--delay: ${i * 0.05}s`}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        /* Cute loading indicator */
        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8rem 0;
          min-height: 400px;
        }

        .loading-container {
          padding: 2px;
          border-radius: 16px;
          position: relative;
          background: rgba(250, 249, 246, 0.75);
          box-shadow: 0 15px 25px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .loading-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 16px;
          padding: 2px;
          background: linear-gradient(135deg,
            rgba(147, 112, 219, 0.4),
            rgba(147, 112, 219, 0.1),
            rgba(147, 112, 219, 0.4),
            rgba(147, 112, 219, 0.1));
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          animation: border-glow 3s infinite linear;
          background-size: 300% 300%;
        }

        .loading-box {
          padding: 2rem 3rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          width: auto;
          min-width: 350px;
          min-height: 180px;
          border-radius: 14px;
          animation: float 3s ease-in-out infinite;
          background: rgba(250, 249, 246, 0.9);
        }

        .emoji-row {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .emoji {
          font-size: 2.2rem;
          filter: drop-shadow(0 0 5px rgba(147, 112, 219, 0.5));
        }

        .emoji.pulse {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .loading-text {
          width: 100%;
          text-align: center;
          font-size: 1.2rem;
          font-weight: 500;
          letter-spacing: 0.5px;
          color: rgba(10, 10, 10, 0.9);
          margin-bottom: 0.5rem;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          min-height: 1.5em;
        }

        .bounce-letter {
          display: inline-block;
          animation: letter-bounce 1.5s infinite;
          animation-delay: var(--delay, 0s);
        }

        @keyframes letter-bounce {
          0%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-6px);
          }
          60% {
            transform: translateY(3px);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
            filter: brightness(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.1);
            filter: brightness(1.2) drop-shadow(0 0 5px rgba(255,255,255,0.5));
          }
        }

        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }

        @keyframes border-glow {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 300% 300%;
          }
        }

        @media (max-width: 640px) {
          .loading-box {
            min-width: 280px;
            padding: 1.5rem 2rem;
          }

          .loading-text {
            font-size: 1rem;
          }

          .emoji {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
}
