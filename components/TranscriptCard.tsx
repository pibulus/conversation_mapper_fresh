/**
 * TranscriptCard Component
 * Displays conversation transcript with speaker highlighting
 */

import { copyToClipboard } from "../utils/toast.ts";
import { formatTranscriptSafe } from "../utils/sanitize.ts";

interface TranscriptCardProps {
  transcript: {
    text: string;
    speakers?: string[];
  } | null;
}

export default function TranscriptCard({ transcript }: TranscriptCardProps) {
  return (
    <div class="w-full">
      <div class="dashboard-card">
        <div class="dashboard-card-header">
          <h3>Transcript</h3>
          <button
            onClick={() => transcript?.text && copyToClipboard(transcript.text)}
            class="text-white cursor-pointer"
            style={{
              transition: 'var(--transition-fast)',
              opacity: 0.9
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.9')}
            title="Copy transcript"
            aria-label="Copy transcript"
            disabled={!transcript?.text}
          >
            <i class="fa fa-copy text-sm"></i>
          </button>
        </div>
        <div class="dashboard-card-body">
          {!transcript?.text || transcript.text.trim() === '' ? (
            <div class="empty-state">
              <div class="empty-state-icon">📄</div>
              <div class="empty-state-text">Quiet here</div>
            </div>
          ) : (
            <div
              class="relative p-4 rounded-lg"
              style={{
                border: '2px solid var(--color-border)',
                background: 'var(--surface-cream)'
              }}
            >
              {/* Format transcript with speaker highlighting (XSS-safe) */}
              <div
                class="whitespace-pre-wrap leading-relaxed"
                style={{
                  fontSize: 'var(--text-size)',
                  color: 'var(--color-text)',
                  lineHeight: '1.8'
                }}
                dangerouslySetInnerHTML={{
                  __html: formatTranscriptSafe(transcript.text)
                }}
              />

              {/* Speaker list if available */}
              {transcript.speakers && transcript.speakers.length > 0 && (
                <div class="mt-4 pt-4" style={{ borderTop: '2px solid var(--color-border)' }}>
                  <div style={{ fontSize: 'var(--tiny-size)', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                    Speakers:
                  </div>
                  <div class="flex flex-wrap gap-2">
                    {transcript.speakers.map((speaker) => (
                      <span
                        key={speaker}
                        class="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          background: 'var(--color-accent)',
                          color: 'white',
                          border: '2px solid var(--color-border)'
                        }}
                      >
                        {speaker}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
