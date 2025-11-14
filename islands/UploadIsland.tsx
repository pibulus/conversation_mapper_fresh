import { useSignal, useComputed } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { conversationData } from "../signals/conversationStore.ts";
import LoadingModal from "../components/LoadingModal.tsx";
import AudioVisualizer from "./AudioVisualizer.tsx";

export default function UploadIsland() {
  const mode = useSignal<'text' | 'audio' | 'record'>('record');
  const textInput = useSignal('');
  const isProcessing = useSignal(false);
  const isRecording = useSignal(false);
  const recordingTime = useSignal(0);
  const showTimeWarning = useSignal(false);

  // Audio recording refs (stored outside signals to avoid reactivity issues)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const MAX_RECORDING_TIME = 10 * 60; // 10 minutes in seconds
  const WARNING_TIME = 30; // 30 seconds before limit

  const timeRemaining = useComputed(() => MAX_RECORDING_TIME - recordingTime.value);

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  async function startRecording() {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create MediaRecorder
      const mimeTypes = ['audio/webm', 'audio/ogg', 'audio/mp4', ''];
      let mediaRecorderOptions: MediaRecorderOptions | undefined;

      for (const mimeType of mimeTypes) {
        if (!mimeType || MediaRecorder.isTypeSupported(mimeType)) {
          mediaRecorderOptions = mimeType ? { mimeType } : undefined;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Set up Web Audio API for visualization
      try {
        const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256; // Frequency resolution
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        console.log('🎵 Web Audio API initialized for visualization');
      } catch (error) {
        console.warn('Failed to initialize Web Audio API:', error);
        // Continue without visualization - not critical
      }

      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      streamRef.current = stream;
      isRecording.value = true;
      recordingTime.value = 0;
      showTimeWarning.value = false;

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        recordingTime.value++;

        // Show warning at 30 seconds remaining
        if (timeRemaining.value <= WARNING_TIME && !showTimeWarning.value) {
          showTimeWarning.value = true;
        }

        // Auto-stop at limit
        if (recordingTime.value >= MAX_RECORDING_TIME) {
          stopRecording();
        }
      }, 1000) as unknown as number;

    } catch (error) {
      console.error("❌ Error starting recording:", error);
      alert("Failed to start recording. Please check microphone permissions.");
      cleanup();
    }
  }

  async function stopRecording() {
    if (!mediaRecorderRef.current || !isRecording.value) return;

    isProcessing.value = true;
    isRecording.value = false;

    // Stop timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder) {
        resolve();
        return;
      }

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        await processAudio(audioBlob);
        cleanup();
        resolve();
      };

      mediaRecorder.stop();
    });
  }

  async function processAudio(audioBlob: Blob) {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);

      const response = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process");
      }

      const result = await response.json();
      console.log('✅ Processing complete:', result);
      conversationData.value = result;
      alert(`✅ Processed! Found ${result.actionItems.length} action items, ${result.nodes.length} topics`);
    } catch (error) {
      console.error("❌ Error processing audio:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isProcessing.value = false;
    }
  }

  function cleanup() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clean up Web Audio API resources
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.warn);
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    recordingTime.value = 0;
    showTimeWarning.value = false;
  }

  const handleTextSubmit = async () => {
    if (!textInput.value.trim()) return;

    isProcessing.value = true;

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textInput.value })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Processing failed');
      }

      const result = await response.json();
      console.log('✅ Processing complete:', result);

      conversationData.value = result;
      alert(`✅ Processed! Found ${result.actionItems.length} action items, ${result.nodes.length} topics`);
      textInput.value = '';
    } catch (error) {
      console.error('❌ Error processing text:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isProcessing.value = false;
    }
  };

  const handleAudioUpload = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    isProcessing.value = true;

    try {
      const formData = new FormData();
      formData.append('audio', file);

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Processing failed');
      }

      const result = await response.json();
      console.log('✅ Processing complete:', result);

      conversationData.value = result;
      alert(`✅ Processed! Found ${result.actionItems.length} action items, ${result.nodes.length} topics`);
      input.value = '';
    } catch (error) {
      console.error('❌ Error processing audio:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isProcessing.value = false;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return (
    <div class="space-y-4">
      {/* Invitation Hook */}
      <p style={{
        textAlign: 'center',
        fontSize: 'clamp(1rem, 2vw, 1.125rem)',
        fontWeight: '500',
        color: 'var(--color-text-secondary)',
        marginBottom: '0.5rem'
      }}>
        Got a conversation? Let's map it
      </p>

      {/* Mode Tabs */}
      <div class="flex gap-2">
        <button
          onClick={() => mode.value = 'record'}
          class={`mode-tab ${mode.value === 'record' ? 'active' : ''}`}
        >
          Record
        </button>
        <button
          onClick={() => mode.value = 'text'}
          class={`mode-tab ${mode.value === 'text' ? 'active' : ''}`}
        >
          Text
        </button>
        <button
          onClick={() => mode.value = 'audio'}
          class={`mode-tab ${mode.value === 'audio' ? 'active' : ''}`}
        >
          Upload
        </button>
      </div>

      {/* Record Mode */}
      {mode.value === 'record' && (
        <div class="space-y-3">
          <button
            onClick={isRecording.value ? stopRecording : startRecording}
            disabled={isProcessing.value && !isRecording.value}
            class="w-full py-6 font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            style={{
              border: `var(--border-width) solid var(--color-border)`,
              background: isRecording.value ? 'var(--color-danger)' : 'var(--color-accent)',
              color: 'white',
              boxShadow: 'var(--shadow-soft)',
              transition: 'var(--transition-medium)'
            }}
          >
            {isRecording.value ? 'Stop' : 'Record'}
          </button>

          {/* Recording Timer & Visualizer */}
          {isRecording.value && (
            <div class="space-y-3">
              <div class="text-center">
                <div style={{
                  fontSize: 'var(--small-size)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '0.25rem'
                }}>Recording</div>
                <div class={`font-mono font-bold ${showTimeWarning.value ? 'animate-pulse' : ''}`} style={{
                  fontSize: '3rem',
                  color: showTimeWarning.value ? 'var(--color-danger)' : 'var(--color-text)',
                  lineHeight: '1'
                }}>
                  {formatTime(timeRemaining.value)}
                </div>
              </div>

              {/* Warning */}
              <div class="rounded-lg p-3" style={{
                background: 'var(--color-danger-bg)',
                border: `2px solid var(--color-danger-border)`,
                fontSize: 'var(--text-size)',
                color: 'var(--color-danger-text)'
              }}>
                Don't leave while recording
              </div>

              {/* Real-time Audio Visualizer */}
              <AudioVisualizer analyser={analyserRef.current} />
            </div>
          )}

        </div>
      )}

      {/* Text Input Mode */}
      {mode.value === 'text' && (
        <div class="space-y-3">
          <textarea
            class="w-full h-48 p-4 rounded-lg focus:outline-none resize-none"
            style={{
              border: `var(--border-width) solid var(--color-border)`,
              background: 'var(--color-secondary)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-size)',
              transition: 'var(--transition-fast)'
            }}
            placeholder="Paste text"
            value={textInput.value}
            onInput={(e) => textInput.value = (e.target as HTMLTextAreaElement).value}
          />
          <button
            onClick={handleTextSubmit}
            disabled={isProcessing.value || !textInput.value.trim()}
            class="px-6 py-3 font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--color-accent)',
              color: 'white',
              border: `var(--border-width) solid var(--color-border)`,
              boxShadow: 'var(--shadow-soft)',
              fontSize: 'var(--text-size)',
              transition: 'var(--transition-medium)'
            }}
          >
            {isProcessing.value ? '⚡ Processing...' : '🚀 Analyze Text'}
          </button>
        </div>
      )}

      {/* Audio Upload Mode */}
      {mode.value === 'audio' && (
        <div class="space-y-3">
          <label class="block rounded-lg p-8 text-center cursor-pointer transition-all hover:bg-white/30" style={{
            border: `2px dashed var(--color-border)`
          }}>
            <input
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              disabled={isProcessing.value}
              class="hidden"
            />
            <i class="fa fa-cloud-upload" style={{
              fontSize: '3rem',
              color: 'var(--color-accent)',
              display: 'block',
              marginBottom: '0.75rem'
            }}></i>
            <p style={{
              fontSize: 'var(--text-size)',
              color: 'var(--color-text)',
              fontWeight: '500',
              marginBottom: '0.25rem'
            }}>
              Drop audio file to upload
            </p>
            <p style={{
              fontSize: 'var(--small-size)',
              color: 'var(--color-text-secondary)'
            }}>
              Or click to choose a file
            </p>
          </label>
        </div>
      )}

      {/* Beautiful Loading Modal */}
      <LoadingModal isOpen={isProcessing.value} />
    </div>
  );
}
