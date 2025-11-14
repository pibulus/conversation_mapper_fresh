import { useSignal, useComputed } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { conversationData } from "../signals/conversationStore.ts";
import LoadingModal from "../components/LoadingModal.tsx";
import AudioVisualizer from "./AudioVisualizer.tsx";

export default function UploadIsland() {
  const textInput = useSignal('');
  const isProcessing = useSignal(false);
  const isRecording = useSignal(false);
  const recordingTime = useSignal(0);
  const showTimeWarning = useSignal(false);
  const lastUploadName = useSignal('');
  const selectedFile = useSignal<File | null>(null);
  const isDragActive = useSignal(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const MAX_RECORDING_TIME = 10 * 60;
  const WARNING_TIME = 30;

  const timeRemaining = useComputed(() => MAX_RECORDING_TIME - recordingTime.value);
  const hasText = useComputed(() => textInput.value.trim().length > 0);
  const primaryLabel = useComputed(() => {
    if (isRecording.value) return 'Stop Recording';
    if (hasText.value) return 'Analyze Text';
    if (selectedFile.value) return 'Map Audio';
    return 'Start Recording';
  });
  const primaryDisabled = useComputed(() => isProcessing.value && !isRecording.value);

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

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

      try {
        const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
      } catch (error) {
        console.warn('Failed to initialize Web Audio API:', error);
      }

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      streamRef.current = stream;
      isRecording.value = true;
      recordingTime.value = 0;
      showTimeWarning.value = false;

      recordingTimerRef.current = setInterval(() => {
        recordingTime.value++;

        if (timeRemaining.value <= WARNING_TIME && !showTimeWarning.value) {
          showTimeWarning.value = true;
        }

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
        await processRecordedAudio(audioBlob);
        resolve();
      };

      mediaRecorder.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;

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

  async function processRecordedAudio(audioBlob: Blob) {
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
    if (!hasText.value) return;

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

  const stageFile = (file: File) => {
    selectedFile.value = file;
    textInput.value = '';
    isDragActive.value = false;
  };

  const handleAudioUpload = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    stageFile(file);
    input.value = '';
  };

  async function processAudioFile(file: File) {
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
      conversationData.value = result;
      lastUploadName.value = file.name;
      alert(`✅ Processed! Found ${result.actionItems.length} action items, ${result.nodes.length} topics`);
    } catch (error) {
      console.error('❌ Error processing audio:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isProcessing.value = false;
      selectedFile.value = null;
    }
  }

  const handlePrimaryAction = async () => {
    if (isRecording.value) {
      await stopRecording();
      return;
    }

    if (hasText.value) {
      await handleTextSubmit();
      return;
    }

    if (selectedFile.value) {
      await processAudioFile(selectedFile.value);
      return;
    }

    if (!isProcessing.value) {
      await startRecording();
    }
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    isDragActive.value = true;
  };

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) {
      isDragActive.value = false;
    }
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    isDragActive.value = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      stageFile(file);
    }
  };

  const clearSelectedFile = () => {
    selectedFile.value = null;
  };

  useEffect(() => () => cleanup(), []);

  return (
    <div class="mapper-input-lab">
      <section class="mapper-capture-block mapper-capture-unified">
        <div class="mapper-block-header">
          <span class="mapper-block-pill">Conversation input</span>
          <div class="mapper-block-meta">Record, paste, or drop audio — one slab.</div>
        </div>

        <div
          class={`mapper-unified-input${isDragActive.value ? ' is-drop' : ''}${selectedFile.value ? ' has-file' : ''}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => textAreaRef.current?.focus()}
        >
          <textarea
            ref={textAreaRef}
            class="mapper-textarea w-full resize-none"
            rows={6}
            placeholder="Paste text, drop audio, or click to type"
            value={textInput.value}
            onInput={(e) => {
              textInput.value = (e.target as HTMLTextAreaElement).value;
              if (selectedFile.value) {
                selectedFile.value = null;
              }
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && hasText.value) {
                e.preventDefault();
                handleTextSubmit();
              }
            }}
            onFocus={() => isDragActive.value = false}
          />

          <div class="mapper-input-hint">
            {selectedFile.value ? (
              <div class="mapper-file-chip">
                <span>{selectedFile.value.name}</span>
                <button
                  type="button"
                  aria-label="Remove file"
                  onClick={(event) => {
                    event.stopPropagation();
                    clearSelectedFile();
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <span>Drop audio or paste text</span>
            )}
            <button
              type="button"
              class="mapper-link-btn"
              onClick={(event) => {
                event.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Browse file
            </button>
          </div>
        </div>

        {isRecording.value && (
          <div class="mapper-record-readout">
            <div>
              <div class="mapper-record-label">Recording</div>
              <div class="mapper-record-time">{formatTime(recordingTime.value)}</div>
            </div>
            <div class="mapper-record-bar">
              <div
                style={{
                  width: `${(recordingTime.value / MAX_RECORDING_TIME) * 100}%`,
                  background: showTimeWarning.value ? '#EF4444' : 'var(--accent-electric)'
                }}
              ></div>
            </div>
            {showTimeWarning.value && (
              <p class="mapper-record-warning">
                Auto-stop in {formatTime(timeRemaining.value)} — wrap it up.
              </p>
            )}
            <AudioVisualizer analyser={analyserRef.current} />
          </div>
        )}

        <div class="mapper-capture-actions">
          <button
            class="mapper-slab-button mapper-slab-button--record"
            disabled={primaryDisabled.value}
            onClick={handlePrimaryAction}
          >
            {primaryLabel.value}
          </button>
          {(hasText.value || selectedFile.value || isRecording.value) && lastUploadName.value && !selectedFile.value && !isRecording.value && (
            <span class="mapper-block-meta">Last mapped: {lastUploadName.value}</span>
          )}
        </div>
      </section>

      <input
        type="file"
        accept="audio/*"
        ref={fileInputRef}
        onChange={handleAudioUpload}
        style={{ display: 'none' }}
      />

      {isProcessing.value && <LoadingModal />}
    </div>
  );
}
