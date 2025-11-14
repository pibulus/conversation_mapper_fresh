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
      {/* Mode Selector - Neo-brutalist tabs */}
      <div class="flex gap-2 mb-6">
        {(['record', 'text', 'audio'] as const).map((tabMode) => (
          <button
            key={tabMode}
            onClick={() => mode.value = tabMode}
            style={{
              flex: 1,
              padding: '0.875rem 1rem',
              fontSize: '1rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              border: '3px solid var(--color-text)',
              borderRadius: '8px',
              background: mode.value === tabMode ? 'var(--color-accent)' : 'white',
              color: mode.value === tabMode ? 'white' : 'var(--color-text)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: mode.value === tabMode ? '3px 3px 0 var(--color-text)' : 'none',
              transform: mode.value === tabMode ? 'translateY(-2px)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (mode.value !== tabMode) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '2px 2px 0 var(--color-text)';
              }
            }}
            onMouseLeave={(e) => {
              if (mode.value !== tabMode) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
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
              padding: '1.5rem 2rem',
              fontSize: '1.25rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              border: '4px solid var(--color-text)',
              borderRadius: '12px',
              background: isRecording.value ? '#EF4444' : 'var(--color-accent)',
              color: 'white',
              cursor: isProcessing.value && !isRecording.value ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '6px 6px 0 var(--color-text)',
              opacity: isProcessing.value && !isRecording.value ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!(isProcessing.value && !isRecording.value)) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '8px 8px 0 var(--color-text)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '6px 6px 0 var(--color-text)';
            }}
            onMouseDown={(e) => {
              if (!(isProcessing.value && !isRecording.value)) {
                e.currentTarget.style.transform = 'translateY(2px)';
                e.currentTarget.style.boxShadow = '3px 3px 0 var(--color-text)';
              }
            }}
            onMouseUp={(e) => {
              if (!(isProcessing.value && !isRecording.value)) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '8px 8px 0 var(--color-text)';
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
                  fontSize: '2.5rem',
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
              padding: '1.25rem',
              fontSize: '1rem',
              lineHeight: '1.6',
              border: '3px solid var(--color-text)',
              borderRadius: '12px',
              background: '#F9FAFB',
              color: 'var(--color-text)',
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
              e.currentTarget.style.borderColor = 'var(--color-accent)';
              e.currentTarget.style.background = 'white';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-text)';
              e.currentTarget.style.background = '#F9FAFB';
            }}
          />
          <button
            onClick={handleTextSubmit}
            disabled={isProcessing.value || !textInput.value.trim()}
            style={{
              width: '100%',
              padding: '1.25rem 2rem',
              fontSize: '1.125rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              border: '4px solid var(--color-text)',
              borderRadius: '12px',
              background: 'var(--color-accent)',
              color: 'white',
              cursor: isProcessing.value || !textInput.value.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '6px 6px 0 var(--color-text)',
              opacity: isProcessing.value || !textInput.value.trim() ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!(isProcessing.value || !textInput.value.trim())) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '8px 8px 0 var(--color-text)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '6px 6px 0 var(--color-text)';
            }}
            onMouseDown={(e) => {
              if (!(isProcessing.value || !textInput.value.trim())) {
                e.currentTarget.style.transform = 'translateY(2px)';
                e.currentTarget.style.boxShadow = '3px 3px 0 var(--color-text)';
              }
            }}
            onMouseUp={(e) => {
              if (!(isProcessing.value || !textInput.value.trim())) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '8px 8px 0 var(--color-text)';
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
              border: '3px dashed var(--color-text)',
              borderRadius: '12px',
              background: '#F9FAFB',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-accent)';
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-text)';
              e.currentTarget.style.background = '#F9FAFB';
              e.currentTarget.style.transform = 'translateY(0)';
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
              fontSize: '1.125rem',
              fontWeight: '700',
              color: 'var(--color-text)',
              marginBottom: '0.5rem'
            }}>
              Drop audio file here
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              fontWeight: '500'
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
