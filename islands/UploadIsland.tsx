import { useSignal, useComputed } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { conversationData } from "../signals/conversationStore.ts";

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
      {/* Mode Tabs */}
      <div class="flex gap-2">
        <button
          onClick={() => mode.value = 'record'}
          class="px-4 py-2 rounded-lg font-semibold"
          style={{
            border: `var(--border-width) solid var(--color-border)`,
            background: mode.value === 'record' ? 'var(--color-accent)' : 'white',
            color: mode.value === 'record' ? 'white' : 'var(--color-text)',
            boxShadow: mode.value === 'record' ? 'var(--shadow-soft)' : 'none',
            transition: 'var(--transition-medium)',
            fontSize: 'var(--text-size)'
          }}
        >
          🎙️ Record
        </button>
        <button
          onClick={() => mode.value = 'text'}
          class="px-4 py-2 rounded-lg font-semibold"
          style={{
            border: `var(--border-width) solid var(--color-border)`,
            background: mode.value === 'text' ? 'var(--color-accent)' : 'white',
            color: mode.value === 'text' ? 'white' : 'var(--color-text)',
            boxShadow: mode.value === 'text' ? 'var(--shadow-soft)' : 'none',
            transition: 'var(--transition-medium)',
            fontSize: 'var(--text-size)'
          }}
        >
          📝 Text
        </button>
        <button
          onClick={() => mode.value = 'audio'}
          class="px-4 py-2 rounded-lg font-semibold"
          style={{
            border: `var(--border-width) solid var(--color-border)`,
            background: mode.value === 'audio' ? 'var(--color-accent)' : 'white',
            color: mode.value === 'audio' ? 'white' : 'var(--color-text)',
            boxShadow: mode.value === 'audio' ? 'var(--shadow-soft)' : 'none',
            transition: 'var(--transition-medium)',
            fontSize: 'var(--text-size)'
          }}
        >
          🎤 Upload
        </button>
      </div>

      {/* Record Mode */}
      {mode.value === 'record' && (
        <div class="space-y-3">
          <button
            onClick={isRecording.value ? stopRecording : startRecording}
            disabled={isProcessing.value && !isRecording.value}
            class="w-full py-4 font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              border: `var(--border-width) solid var(--color-border)`,
              background: isRecording.value ? '#EF4444' : 'var(--color-accent)',
              color: 'white',
              boxShadow: 'var(--shadow-soft)',
              transition: 'var(--transition-medium)',
              fontSize: 'var(--text-size)'
            }}
          >
            {isRecording.value ? '⏹ Stop Recording' : '🎙️ Start Recording'}
          </button>

          {/* Recording Timer & Visualizer */}
          {isRecording.value && (
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span style={{
                  fontSize: 'var(--text-size)',
                  color: 'var(--color-text-secondary)'
                }}>Recording time limit: 10 minutes</span>
                <span class={`font-mono font-bold ${showTimeWarning.value ? 'animate-pulse' : ''}`} style={{
                  fontSize: 'calc(var(--text-size) * 1.2)',
                  color: showTimeWarning.value ? '#EF4444' : 'var(--color-text)'
                }}>
                  {formatTime(timeRemaining.value)}
                </span>
              </div>

              {/* Warning */}
              <div class="rounded-lg p-3" style={{
                background: '#FEE2E2',
                border: `2px solid #FECACA`,
                fontSize: 'var(--text-size)',
                color: '#B91C1C'
              }}>
                <strong>⚠️ Recording in progress:</strong> You must stop recording before leaving this page
              </div>

              {/* Simple Audio Visualizer */}
              <div class="rounded-lg p-4 h-20 flex items-center justify-center" style={{
                background: 'var(--color-base-solid)',
                opacity: 0.5
              }}>
                <div class="flex gap-1 items-end h-full">
                  {[...Array(24)].map((_, i) => (
                    <div
                      key={i}
                      class="w-2 rounded-t animate-pulse"
                      style={{
                        background: 'var(--color-accent)',
                        height: `${30 + Math.random() * 70}%`,
                        animationDelay: `${i * 0.08}s`,
                        animationDuration: '0.8s'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {isProcessing.value && !isRecording.value && (
            <p class="text-center font-semibold" style={{
              fontSize: 'var(--text-size)',
              color: 'var(--color-accent)'
            }}>
              ⚡ Processing audio...
            </p>
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
            placeholder="Paste your conversation text here..."
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
          <div class="rounded-lg p-8 text-center" style={{
            border: `var(--border-width) dashed var(--color-border)`,
            transition: 'var(--transition-medium)'
          }}>
            <input
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              disabled={isProcessing.value}
              class="w-full cursor-pointer"
              style={{
                fontSize: 'var(--text-size)'
              }}
            />
            <p class="mt-2" style={{
              fontSize: 'var(--small-size)',
              color: 'var(--color-text-secondary)'
            }}>
              Upload audio file (MP3, WAV, M4A, etc.)
            </p>
          </div>
          {isProcessing.value && (
            <p class="text-center font-semibold" style={{
              fontSize: 'var(--text-size)',
              color: 'var(--color-accent)'
            }}>
              ⚡ Processing audio...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
