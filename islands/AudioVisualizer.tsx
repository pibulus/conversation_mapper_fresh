/**
 * Audio Visualizer Island - Real-time frequency visualization
 *
 * Uses Web Audio API AnalyserNode to display actual audio frequency data
 * Ported from Svelte AudioVisualizer.svelte
 */

import { useEffect, useRef } from "preact/hooks";

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
}

export default function AudioVisualizer({ analyser }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!analyser || !canvasRef.current) {
      console.warn('AudioVisualizer: No analyser or canvas available');
      return;
    }

    console.log('🎵 Initializing audio visualizer');
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');

    if (!canvasCtx) {
      console.error('Failed to get canvas context');
      return;
    }

    // Initialize data array for frequency data
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    console.log(`🎵 Audio visualizer initialized (${analyser.frequencyBinCount} frequency bins)`);

    // Animation draw function
    function draw() {
      if (!analyser || !canvasCtx || !canvas || !dataArrayRef.current) return;

      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;

      animationFrameIdRef.current = requestAnimationFrame(draw);

      // Get frequency data from analyser
      analyser.getByteFrequencyData(dataArrayRef.current);

      // Clear canvas
      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

      // Calculate bar dimensions
      const barWidth = (WIDTH / dataArrayRef.current.length) * 2.5;
      let barHeight: number;
      let x = 0;

      // Draw frequency bars
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        barHeight = dataArrayRef.current[i] / 2;

        // Create gradient for each bar (purple to blue)
        const gradient = canvasCtx.createLinearGradient(
          x,
          HEIGHT - barHeight,
          x,
          HEIGHT
        );
        gradient.addColorStop(0, 'rgba(136, 57, 239, 0.8)'); // Primary purple
        gradient.addColorStop(1, 'rgba(29, 78, 216, 0.6)');  // Secondary blue

        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    }

    // Start animation
    draw();

    // Cleanup
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      console.log('🎵 Audio visualizer cleaned up');
    };
  }, [analyser]);

  return (
    <div
      class="w-full rounded-lg p-2"
      style={{
        background: 'var(--color-base-solid)',
        border: '2px solid var(--color-border)'
      }}
    >
      <canvas
        ref={canvasRef}
        class="w-full rounded"
        width="1024"
        height="200"
        style={{
          display: 'block',
          maxHeight: '80px'
        }}
      />
    </div>
  );
}
