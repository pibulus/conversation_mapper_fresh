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
    <div>
      {/* Mode Selector - Small outlined tabs */}
      <div class="flex gap-2 mb-5" style={{
        maxWidth: '320px',
        margin: '0 auto 1.5rem',
        justifyContent: 'center'
      }}>
        {(['record', 'text', 'audio'] as const).map((tabMode) => (
          <button
            key={tabMode}
            onClick={() => mode.value = tabMode}
            style={{
              padding: '7px 18px',
              fontSize: '13px',
              fontWeight: '600',
              border: mode.value === tabMode ? '1.5px solid #1A1A1A' : '1px solid rgba(0, 0, 0, 0.15)',
              borderRadius: '8px',
              background: mode.value === tabMode ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
              color: mode.value === tabMode ? '#0A0A0A' : '#666',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              letterSpacing: '0.01em'
            }}
            onMouseEnter={(e) => {
              if (mode.value !== tabMode) {
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.color = '#1A1A1A';
              } else {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.06)';
              }
            }}
            onMouseLeave={(e) => {
              if (mode.value !== tabMode) {
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.color = '#666';
              } else {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
              }
            }}
          >
            {tabMode === 'record' ? 'Record' : tabMode === 'text' ? 'Text' : 'Upload'}
          </button>
        ))}
      </div>

      {/* Record Mode */}
      {mode.value === 'record' && (
        <div class="space-y-4">
          <button
            onClick={isRecording.value ? stopRecording : startRecording}
            disabled={isProcessing.value && !isRecording.value}
            style={{
              width: '100%',
              padding: '18px 32px',
              fontSize: '17px',
              fontWeight: '700',
              border: '2px solid rgba(0, 0, 0, 0.2)',
              borderRadius: '10px',
              background: isRecording.value ? '#EF4444' : '#1A1A1A',
              color: 'white',
              cursor: isProcessing.value && !isRecording.value ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              opacity: isProcessing.value && !isRecording.value ? 0.5 : 1,
              boxShadow: '4px 4px 0 0 rgba(0, 0, 0, 0.1)',
              position: 'relative',
              letterSpacing: '-0.01em'
            }}
            onMouseEnter={(e) => {
              if (!(isProcessing.value && !isRecording.value)) {
                e.currentTarget.style.transform = 'translate(-2px, -2px)';
                e.currentTarget.style.boxShadow = '6px 6px 0 0 rgba(0, 0, 0, 0.15), 0 0 0 2px var(--color-accent)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(0, 0)';
              e.currentTarget.style.boxShadow = '4px 4px 0 0 rgba(0, 0, 0, 0.1)';
            }}
            onMouseDown={(e) => {
              if (!(isProcessing.value && !isRecording.value)) {
                e.currentTarget.style.transform = 'translate(1px, 1px)';
                e.currentTarget.style.boxShadow = '2px 2px 0 0 rgba(0, 0, 0, 0.12)';
              }
            }}
            onMouseUp={(e) => {
              if (!(isProcessing.value && !isRecording.value)) {
                e.currentTarget.style.transform = 'translate(-2px, -2px)';
                e.currentTarget.style.boxShadow = '6px 6px 0 0 rgba(0, 0, 0, 0.15), 0 0 0 2px var(--color-accent)';
              }
            }}
          >
            {isRecording.value ? 'Stop Recording' : 'Start Recording'}
          </button>

          {/* Recording Timer & Progress Bar */}
          {isRecording.value && (
            <div class="space-y-4 pt-2">
              {/* Elapsed time display */}
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

              {/* Progress bar */}
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

              {/* Warning (only show when near limit) */}
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

              {/* Real-time Audio Visualizer */}
              <AudioVisualizer analyser={analyserRef.current} />
            </div>
          )}
        </div>
      )}

      {/* Text Input Mode */}
      {mode.value === 'text' && (
        <div class="space-y-4">
          <textarea
            class="w-full resize-none focus:outline-none"
            rows={8}
            style={{
              padding: '16px',
              fontSize: '15px',
              lineHeight: '1.5',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '10px',
              background: 'rgba(0, 0, 0, 0.02)',
              color: '#2C2C2C',
              transition: 'all 0.2s ease'
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
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)';
              e.currentTarget.style.background = 'white';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
            }}
          />
          <button
            onClick={handleTextSubmit}
            disabled={isProcessing.value || !textInput.value.trim()}
            style={{
              width: '100%',
              padding: '18px 32px',
              fontSize: '17px',
              fontWeight: '700',
              border: '2px solid rgba(0, 0, 0, 0.2)',
              borderRadius: '10px',
              background: '#1A1A1A',
              color: 'white',
              cursor: isProcessing.value || !textInput.value.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              opacity: isProcessing.value || !textInput.value.trim() ? 0.5 : 1,
              boxShadow: '4px 4px 0 0 rgba(0, 0, 0, 0.1)',
              letterSpacing: '-0.01em'
            }}
            onMouseEnter={(e) => {
              if (!(isProcessing.value || !textInput.value.trim())) {
                e.currentTarget.style.transform = 'translate(-2px, -2px)';
                e.currentTarget.style.boxShadow = '6px 6px 0 0 rgba(0, 0, 0, 0.15), 0 0 0 2px var(--color-accent)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(0, 0)';
              e.currentTarget.style.boxShadow = '4px 4px 0 0 rgba(0, 0, 0, 0.1)';
            }}
            onMouseDown={(e) => {
              if (!(isProcessing.value || !textInput.value.trim())) {
                e.currentTarget.style.transform = 'translate(1px, 1px)';
                e.currentTarget.style.boxShadow = '2px 2px 0 0 rgba(0, 0, 0, 0.12)';
              }
            }}
            onMouseUp={(e) => {
              if (!(isProcessing.value || !textInput.value.trim())) {
                e.currentTarget.style.transform = 'translate(-2px, -2px)';
                e.currentTarget.style.boxShadow = '6px 6px 0 0 rgba(0, 0, 0, 0.15), 0 0 0 2px var(--color-accent)';
              }
            }}
          >
            {isProcessing.value ? 'Processing...' : 'Analyze Text'}
          </button>
        </div>
      )}

      {/* Audio Upload Mode */}
      {mode.value === 'audio' && (
        <div class="space-y-4">
          <label
            style={{
              display: 'block',
              padding: '3rem 2rem',
              textAlign: 'center',
              border: '2px dashed rgba(0, 0, 0, 0.15)',
              borderRadius: '10px',
              background: 'rgba(0, 0, 0, 0.02)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.3)';
              e.currentTarget.style.background = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
            }}
          >
            <input
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              disabled={isProcessing.value}
              style={{ display: 'none' }}
            />
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#2C2C2C',
              marginBottom: '0.5rem'
            }}>
              Drop audio file here
            </div>
            <div style={{
              fontSize: '14px',
              color: '#666'
            }}>
              or click to browse
            </div>
          </label>
        </div>
      )}

      {/* Loading Modal */}
      {isProcessing.value && <LoadingModal />}
    </div>
  );
}
