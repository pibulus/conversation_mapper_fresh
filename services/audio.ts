import { encodeBase64 } from "$std/encoding/base64.ts";
import type { GeminiAudioPart } from "@core/ai/gemini.ts";
import { getGeminiApiKey } from "@services/ai.ts";

const UPLOAD_ENDPOINT =
  "https://generativelanguage.googleapis.com/upload/v1beta/files";
const FILES_BASE = "https://generativelanguage.googleapis.com/v1beta";

export interface UploadedAudioFile {
  part: GeminiAudioPart;
  fileName: string | null;
}

const MAX_DELETE_RETRIES = Number(
  Deno.env.get("GEMINI_DELETE_RETRIES") ?? "3",
);
const DELETE_RETRY_DELAY_MS = Number(
  Deno.env.get("GEMINI_DELETE_RETRY_DELAY_MS") ?? "2000",
);

export async function uploadAudioFile(file: File): Promise<UploadedAudioFile> {
  const apiKey = getGeminiApiKey();
  const mimeType = file.type || "application/octet-stream";
  const displayName = file.name || "conversation-audio";
  const boundary = `Boundary-${crypto.randomUUID()}`;

  const metadata = JSON.stringify({
    file: {
      displayName,
      mimeType,
    },
  });

  const multipartBody = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
    `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
    file,
    `\r\n--${boundary}--`,
  ]);

  const response = await fetch(`${UPLOAD_ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "X-Goog-Upload-Protocol": "multipart",
    },
    body: multipartBody,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(
      `Failed to upload audio (${response.status}): ${
        errText || response.statusText
      }`,
    );
  }

  const payload = await response.json();
  const uploadedFile = payload.file ?? payload;

  if (uploadedFile?.uri) {
    return {
      part: {
        fileData: {
          fileUri: uploadedFile.uri,
          mimeType: uploadedFile.mimeType ?? mimeType,
        },
      },
      fileName: uploadedFile.name ?? null,
    };
  }

  // Fallback to inline data if API didn't return a file URI
  const base64 = encodeBase64(new Uint8Array(await file.arrayBuffer()));
  return {
    part: {
      inlineData: {
        mimeType,
        data: base64,
      },
    },
    fileName: null,
  };
}

export async function deleteUploadedFile(
  name: string | null | undefined,
  attempt = 0,
) {
  if (!name) return;

  try {
    const apiKey = getGeminiApiKey();
    const normalizedName = name.startsWith("files/") ? name : `files/${name}`;
    const response = await fetch(
      `${FILES_BASE}/${normalizedName}?key=${apiKey}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      handleDeleteFailure(
        name,
        response.status,
        errorText,
        attempt,
      );
    }
  } catch (error) {
    handleDeleteFailure(name, 0, String(error), attempt);
  }
}

function handleDeleteFailure(
  name: string,
  status: number,
  errorText: string,
  attempt: number,
) {
  if (attempt < MAX_DELETE_RETRIES - 1) {
    setTimeout(() => {
      deleteUploadedFile(name, attempt + 1).catch((error) =>
        console.warn(`⚠️  Retry delete failed for ${name}:`, error)
      );
    }, DELETE_RETRY_DELAY_MS);
  } else {
    console.warn(
      `⚠️  Failed to delete Gemini file ${name}: ${status} ${errorText}`,
    );
  }
}
