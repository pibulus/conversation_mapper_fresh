import { useSignal, useComputed } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { conversationData } from "../signals/conversationStore.ts";
import LoadingModal from "../components/LoadingModal.tsx";
import AudioVisualizer from "./AudioVisualizer.tsx";

const MODE_TABS = [
  { key: 'record', label: 'Record' },
  { key: 'text', label: 'Paste' },
  { key: 'audio', label: 'Upload' }
] as const;

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please grant permission and try again.');
    }
  }

  function stopRecording() {
    if (!mediaRecorderRef.current) return;

    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        console.log('🎤 Recording stopped. Blob size:', audioBlob.size);

        // Process the audio
        await processAudio(audioBlob);

        resolve();
      };

      mediaRecorder.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      isRecording.value = false;

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      cleanup();
    });
  }

  function cleanup() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }

  async function processAudio(audioBlob: Blob) {
    isProcessing.value = true;

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

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
    } catch (error) {
      console.error('❌ Error processing audio:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isProcessing.value = false;
    }
  }

  async function handleTextSubmit() {
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
      textInput.value = '';
      alert(`✅ Processed! Found ${result.actionItems.length} action items, ${result.nodes.length} topics`);
    } catch (error) {
      console.error('❌ Error processing text:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isProcessing.value = false;
    }
  }

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
    <div class="softstack-input-lab">
      <div class="softstack-mode-tabs" role="tablist" aria-label="Capture mode">
        {MODE_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode.value === key}
            class={`softstack-mode-tab${mode.value === key ? ' is-active' : ''}`}
            onClick={() => mode.value = key}
          >
            {label}
          </button>
        ))}
      </div>

      {mode.value === 'record' && (
        <div class="softstack-panel-body">
          <button
            onClick={isRecording.value ? stopRecording : startRecording}
            disabled={isProcessing.value && !isRecording.value}
            class={`softstack-slab-button${isRecording.value ? ' is-accent' : ''}`}
          >
            {isRecording.value ? 'Stop' : 'Record'}
          </button>
          <div class="softstack-panel-scroll">
            <div class="softstack-info-note">Live capture</div>
            {isRecording.value ? (
              <div class="space-y-4 pt-2">
                <div class="text-center">
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Recording</div>
                  <div class="font-mono font-bold" style={{
                    fontSize: 'clamp(2rem, 6vw, 2.5rem)',
                    color: 'var(--color-text)',
                    lineHeight: '1'
                  }}>
                    {formatTime(recordingTime.value)}
                  </div>
                </div>
                <div style={{
                  width: '100%',
                  height: '12px',
                  background: '#E5E7EB',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '2px solid var(--color-text)'
                }}>
                  <div style={{
                    width: `${(recordingTime.value / MAX_RECORDING_TIME) * 100}%`,
                    height: '100%',
                    background: showTimeWarning.value ? '#EF4444' : 'var(--color-accent)',
                    transition: 'width 0.3s ease-out, background 0.5s ease'
                  }}></div>
                </div>
                {showTimeWarning.value && (
                  <div style={{
                    padding: '1rem',
                    background: '#FEE2E2',
                    border: '2px solid #DC2626',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#991B1B',
                    textAlign: 'center'
                  }}>
                    Don't leave while recording
                  </div>
                )}
                <AudioVisualizer analyser={analyserRef.current} />
              </div>
            ) : (
              <p style={{
                fontSize: '0.9rem',
                lineHeight: '1.5',
                color: 'rgba(0, 0, 0, 0.65)'
              }}>
                Ten-minute limit. We warn you with 30 seconds left and keep
                everything inside your browser.
              </p>
            )}
          </div>
        </div>
      )}

      {mode.value === 'text' && (
        <div class="softstack-panel-body">
          <div class="softstack-info-note">Paste transcript</div>
          <textarea
            class="w-full resize-none focus:outline-none"
            rows={8}
            style={{
              padding: '18px',
              fontSize: '15px',
              lineHeight: '1.5',
              border: '2px solid var(--softstack-ink)',
              borderRadius: '14px',
              background: 'rgba(0, 0, 0, 0.02)',
              color: '#2C2C2C',
              transition: 'all 0.2s ease',
              boxShadow: 'inset 0 4px 0 rgba(0, 0, 0, 0.05)'
            }}
            placeholder="Paste your conversation here..."
            value={textInput.value}
            onInput={(e) => textInput.value = (e.target as HTMLTextAreaElement).value}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && textInput.value.trim()) {
                e.preventDefault();
                handleTextSubmit();
              }
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-accent)';
              e.currentTarget.style.background = 'white';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--softstack-ink)';
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
            }}
          />
          <button
            onClick={handleTextSubmit}
            disabled={isProcessing.value || !textInput.value.trim()}
            class="softstack-slab-button is-accent"
            style={{ opacity: isProcessing.value || !textInput.value.trim() ? 0.5 : 1 }}
          >
            {isProcessing.value ? 'Processing...' : 'Paste'}
          </button>
        </div>
      )}

      {mode.value === 'audio' && (
        <div class="softstack-panel-body">
          <div class="softstack-info-note">Upload audio</div>
          <input
            type="file"
            accept="audio/*"
            ref={fileInputRef}
            onChange={handleAudioUpload}
            disabled={isProcessing.value}
            style={{ display: 'none' }}
          />
          <div
            role="button"
            tabIndex={0}
            onClick={() => !isProcessing.value && fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !isProcessing.value) {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              border: '3px dashed var(--softstack-ink)',
              borderRadius: '14px',
              background: 'rgba(0, 0, 0, 0.03)',
              cursor: isProcessing.value ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.4)'
            }}
            onMouseEnter={(e) => {
              if (!isProcessing.value) {
                e.currentTarget.style.borderColor = 'var(--color-accent)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--softstack-ink)';
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
            }}
          >
            <div style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: '#2C2C2C',
              marginBottom: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}>
              Drop audio file here
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: '#666'
            }}>
              We accept anything your browser can decode.
            </div>
          </div>
          <button
            type="button"
            class="softstack-slab-button"
            disabled={isProcessing.value}
            style={{ opacity: isProcessing.value ? 0.5 : 1 }}
            onClick={() => fileInputRef.current?.click()}
          >
            {isProcessing.value ? 'Processing...' : 'Upload'}
          </button>
        </div>
      )}

      {isProcessing.value && <LoadingModal />}
    </div>
  );
}
