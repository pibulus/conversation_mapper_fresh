/**
 * Audio Recorder Island - Record and append audio to conversations
 *
 * Features:
 * - Record audio with MediaRecorder API
 * - Display existing recordings
 * - Play/pause/download controls
 * - 10-minute time limit with warnings
 * - Navigation blocking during recording
 * - Append to existing conversation
 */

import { useSignal, useComputed } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { conversationData } from "../signals/conversationStore.ts";

interface Recording {
  id: string;
  conversation_id: string;
  file_name: string;
  data: Blob;
  created_at: string;
}

interface AudioRecorderProps {
  conversationId: string;
  onRecordingComplete?: () => void;
}

export default function AudioRecorder({ conversationId, onRecordingComplete }: AudioRecorderProps) {
  // Recording state
  const isRecording = useSignal(false);
  const isProcessing = useSignal(false);
  const recordingTime = useSignal(0);
  const showTimeWarning = useSignal(false);
  const isExpanded = useSignal(false);

  // Recordings list
  const recordings = useSignal<Recording[]>([]);
  const playingRecordingId = useSignal<string | null>(null);

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Time constants
  const MAX_RECORDING_TIME = 10 * 60; // 10 minutes in seconds
  const WARNING_TIME = 30; // 30 seconds before limit

  const timeRemaining = useComputed(() => MAX_RECORDING_TIME - recordingTime.value);

  // Format time as MM:SS
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // Format date for display
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  // Start recording
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

      // Create MediaRecorder with fallback mime types
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

  // Stop recording
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

        await processAudioAppend(audioBlob);
        cleanup();
        resolve();
      };

      mediaRecorder.stop();
    });
  }

  // Process audio and append to conversation
  async function processAudioAppend(audioBlob: Blob) {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("conversationId", conversationId);

      // Pass existing transcript and action items for smart appending
      if (conversationData.value) {
        if (conversationData.value.transcript?.text) {
          formData.append("existingTranscript", conversationData.value.transcript.text);
        }

        if (conversationData.value.actionItems) {
          formData.append("existingActionItems", JSON.stringify(conversationData.value.actionItems));
        }
      }

      const response = await fetch("/api/append", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process");
      }

      const result = await response.json();
      console.log('✅ Audio appended successfully:', result);

      // Update conversation data
      conversationData.value = result;

      // Add recording to list
      const newRecording: Recording = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        file_name: `Recording ${recordings.value.length + 1}`,
        data: audioBlob,
        created_at: new Date().toISOString()
      };
      recordings.value = [...recordings.value, newRecording];

      // Call completion callback
      if (onRecordingComplete) {
        onRecordingComplete();
      }

      const completedCount = result.actionItems.filter((i: any) => i.status === 'completed').length;
      const pendingCount = result.actionItems.filter((i: any) => i.status === 'pending').length;

      alert(`✅ Recording added!\n${pendingCount} pending • ${completedCount} completed`);
    } catch (error) {
      console.error("❌ Error processing audio:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isProcessing.value = false;
    }
  }

  // Cleanup recording resources
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

  // Play/pause recording
  function togglePlayback(recording: Recording) {
    if (playingRecordingId.value === recording.id) {
      // Pause
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      playingRecordingId.value = null;
    } else {
      // Play
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }

      const audio = new Audio(URL.createObjectURL(recording.data));
      audio.play();
      audio.onended = () => {
        playingRecordingId.value = null;
      };
      audioElementRef.current = audio;
      playingRecordingId.value = recording.id;
    }
  }

  // Download recording
  function downloadRecording(recording: Recording) {
    const url = URL.createObjectURL(recording.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = recording.file_name;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Handle beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRecording.value) {
        e.preventDefault();
        e.returnValue = 'Recording in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanup();
    };
  }, []);

  return (
    <div class="relative">
      {/* Compact button in header */}
      <button
        onClick={() => isExpanded.value = !isExpanded.value}
        class="flex items-center gap-2 px-3 py-2 rounded-lg hover:brightness-110 transition-all relative"
        style={{
          background: isRecording.value ? '#EF4444' : 'var(--color-accent)',
          border: `2px solid var(--color-border)`,
          color: 'white',
          fontWeight: '600',
          fontSize: 'var(--text-size)',
          boxShadow: 'var(--shadow-soft)'
        }}
        title={isRecording.value ? 'Recording...' : 'Audio Recordings'}
      >
        <i class={isRecording.value ? "fa fa-circle animate-pulse" : "fa fa-microphone"}></i>
        {isRecording.value && (
          <span class="font-mono text-sm">{formatTime(timeRemaining.value)}</span>
        )}
        {recordings.value.length > 0 && !isRecording.value && (
          <span class="absolute -top-1 -right-1 bg-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center" style={{
            color: 'var(--color-accent)',
            border: '2px solid var(--color-border)'
          }}>
            {recordings.value.length}
          </span>
        )}
      </button>

      {/* Expanded panel */}
      {isExpanded.value && (
        <div
          class="absolute top-full right-0 mt-2 rounded-lg shadow-2xl z-50"
          style={{
            background: 'var(--color-secondary)',
            border: `var(--border-width) solid var(--color-border)`,
            width: '380px',
            maxHeight: '500px',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            background: 'var(--color-accent)',
            padding: 'var(--card-padding)',
            borderBottom: `var(--border-width) solid var(--color-border)`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{
              fontSize: 'var(--heading-size)',
              fontWeight: 'var(--heading-weight)',
              color: 'white'
            }}>🎙️ Audio Recordings</h3>
            <button
              onClick={() => isExpanded.value = false}
              class="text-white hover:text-gray-200"
            >
              <i class="fa fa-times"></i>
            </button>
          </div>

          {/* Recording controls */}
          <div style={{ padding: 'var(--card-padding)' }}>
            <button
              onClick={isRecording.value ? stopRecording : startRecording}
              disabled={isProcessing.value && !isRecording.value}
              class="w-full py-3 font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed mb-3"
              style={{
                border: `var(--border-width) solid var(--color-border)`,
                background: isRecording.value ? '#EF4444' : 'var(--color-accent)',
                color: 'white',
                boxShadow: 'var(--shadow-soft)',
                transition: 'var(--transition-medium)',
                fontSize: 'var(--text-size)'
              }}
            >
              {isRecording.value ? '⏹ Stop Recording' : '🎙️ Add Recording'}
            </button>

            {/* Recording warning */}
            {isRecording.value && (
              <div class="space-y-2 mb-4">
                <div class="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--color-text-secondary)' }}>Time remaining:</span>
                  <span class={`font-mono font-bold ${showTimeWarning.value ? 'animate-pulse text-red-500' : ''}`}>
                    {formatTime(timeRemaining.value)}
                  </span>
                </div>
                <div class="rounded p-2 text-xs" style={{
                  background: '#FEE2E2',
                  border: '2px solid #FECACA',
                  color: '#B91C1C'
                }}>
                  ⚠️ Don't leave the page while recording
                </div>
              </div>
            )}

            {/* Processing indicator */}
            {isProcessing.value && (
              <div class="flex items-center justify-center gap-2 py-4">
                <span class="animate-spin">⚡</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>Processing audio...</span>
              </div>
            )}
          </div>

          {/* Recordings list */}
          <div style={{
            padding: '0 var(--card-padding) var(--card-padding)',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {recordings.value.length === 0 ? (
              <div class="text-center py-6">
                <i class="fa fa-microphone text-3xl mb-2" style={{ color: 'var(--color-text-secondary)', opacity: 0.3 }}></i>
                <p style={{
                  fontSize: 'var(--small-size)',
                  color: 'var(--color-text-secondary)'
                }}>No recordings yet</p>
              </div>
            ) : (
              <div class="space-y-2">
                {recordings.value.map((recording) => (
                  <div
                    key={recording.id}
                    class="rounded-lg p-3 hover:bg-white/50 transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.3)',
                      border: '2px solid var(--color-border)'
                    }}
                  >
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex-1 min-w-0">
                        <p style={{
                          fontSize: 'var(--text-size)',
                          fontWeight: '600',
                          color: 'var(--color-text)'
                        }} class="truncate">
                          {recording.file_name}
                        </p>
                        <p style={{
                          fontSize: 'var(--tiny-size)',
                          color: 'var(--color-text-secondary)'
                        }}>
                          {formatDate(recording.created_at)}
                        </p>
                      </div>
                      <div class="flex gap-1">
                        <button
                          onClick={() => togglePlayback(recording)}
                          class="w-8 h-8 flex items-center justify-center rounded hover:bg-white/50 transition-colors"
                          title={playingRecordingId.value === recording.id ? 'Pause' : 'Play'}
                        >
                          <i class={`fa ${playingRecordingId.value === recording.id ? 'fa-pause' : 'fa-play'} text-sm`}></i>
                        </button>
                        <button
                          onClick={() => downloadRecording(recording)}
                          class="w-8 h-8 flex items-center justify-center rounded hover:bg-white/50 transition-colors"
                          title="Download"
                        >
                          <i class="fa fa-download text-sm"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
