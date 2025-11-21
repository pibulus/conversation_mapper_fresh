const DOWNLOAD_PREFIX = "conversation-backup";

export function saveAudioBackup(blob: Blob, conversationId?: string) {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");
  const suffix = conversationId ? `-${conversationId}` : "";
  const filename = `${DOWNLOAD_PREFIX}${suffix}-${timestamp}.webm`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
