/**
 * Skeleton Loading Card
 *
 * Modern skeleton screen for better perceived performance
 * Shows while actual content is loading
 */

export interface SkeletonCardProps {
  type?: 'summary' | 'transcript' | 'actions' | 'viz' | 'default';
}

export default function SkeletonCard({ type = 'default' }: SkeletonCardProps) {
  return (
    <div class="card skeleton-card" aria-busy="true" aria-label="Loading content">
      {type === 'summary' && <SummarySkeleton />}
      {type === 'transcript' && <TranscriptSkeleton />}
      {type === 'actions' && <ActionsSkeleton />}
      {type === 'viz' && <VizSkeleton />}
      {type === 'default' && <DefaultSkeleton />}

      <style>{`
        .skeleton-card {
          position: relative;
          overflow: hidden;
          pointer-events: none;
        }

        .skeleton-line {
          height: 1rem;
          background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.06) 0%,
            rgba(0, 0, 0, 0.08) 50%,
            rgba(0, 0, 0, 0.06) 100%
          );
          border-radius: 4px;
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          margin-bottom: 0.75rem;
        }

        .skeleton-circle {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.06) 0%,
            rgba(0, 0, 0, 0.08) 50%,
            rgba(0, 0, 0, 0.06) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-box {
          background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.06) 0%,
            rgba(0, 0, 0, 0.08) 50%,
            rgba(0, 0, 0, 0.06) 100%
          );
          border-radius: 8px;
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .skeleton-line,
          .skeleton-circle,
          .skeleton-box {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div style={{ padding: '1rem' }}>
      <div class="skeleton-line" style={{ width: '40%', marginBottom: '1.25rem' }}></div>
      <div class="skeleton-line" style={{ width: '100%' }}></div>
      <div class="skeleton-line" style={{ width: '95%' }}></div>
      <div class="skeleton-line" style={{ width: '85%', marginBottom: '0' }}></div>
    </div>
  );
}

function TranscriptSkeleton() {
  return (
    <div style={{ padding: '1rem' }}>
      <div class="skeleton-line" style={{ width: '30%', marginBottom: '1.25rem' }}></div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <div class="skeleton-circle"></div>
        <div style={{ flex: 1 }}>
          <div class="skeleton-line" style={{ width: '25%', height: '0.75rem', marginBottom: '0.5rem' }}></div>
          <div class="skeleton-line" style={{ width: '100%' }}></div>
          <div class="skeleton-line" style={{ width: '80%', marginBottom: '0' }}></div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <div class="skeleton-circle"></div>
        <div style={{ flex: 1 }}>
          <div class="skeleton-line" style={{ width: '25%', height: '0.75rem', marginBottom: '0.5rem' }}></div>
          <div class="skeleton-line" style={{ width: '90%' }}></div>
          <div class="skeleton-line" style={{ width: '95%', marginBottom: '0' }}></div>
        </div>
      </div>
    </div>
  );
}

function ActionsSkeleton() {
  return (
    <div style={{ padding: '1rem' }}>
      <div class="skeleton-line" style={{ width: '35%', marginBottom: '1.25rem' }}></div>
      {[1, 2, 3].map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.875rem', alignItems: 'center' }}>
          <div class="skeleton-box" style={{ width: '1.25rem', height: '1.25rem', borderRadius: '4px' }}></div>
          <div style={{ flex: 1 }}>
            <div class="skeleton-line" style={{ width: '70%', marginBottom: '0.25rem' }}></div>
            <div class="skeleton-line" style={{ width: '40%', height: '0.75rem', marginBottom: '0' }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function VizSkeleton() {
  return (
    <div style={{ padding: '1rem' }}>
      <div class="skeleton-line" style={{ width: '40%', marginBottom: '1.25rem' }}></div>
      <div class="skeleton-box" style={{ width: '100%', height: '300px' }}></div>
    </div>
  );
}

function DefaultSkeleton() {
  return (
    <div style={{ padding: '1rem' }}>
      <div class="skeleton-line" style={{ width: '50%', marginBottom: '1.25rem' }}></div>
      <div class="skeleton-line" style={{ width: '100%' }}></div>
      <div class="skeleton-line" style={{ width: '90%' }}></div>
      <div class="skeleton-line" style={{ width: '75%', marginBottom: '0' }}></div>
    </div>
  );
}
