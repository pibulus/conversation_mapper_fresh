/**
 * Tests for core/ai/openrouter.ts
 *
 * Uses an injected fetch implementation to verify request formatting without
 * real API calls.
 */

import { assertEquals, assertStringIncludes } from "./_assert.ts";

import { createOpenRouterService } from "../ai/openrouter.ts";
import type { OpenRouterAudioPart } from "../ai/types.ts";

function jsonResponse(content: string) {
  return new Response(
    JSON.stringify({
      choices: [
        {
          message: { content },
        },
      ],
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

Deno.test("OpenRouter generateMarkdown posts chat completion request", async () => {
  let capturedUrl = "";
  let capturedBody: any = null;
  let capturedHeaders: Headers | null = null;

  const service = createOpenRouterService({
    apiKey: "test-key",
    model: "google/gemini-2.5-flash-lite",
    siteUrl: "http://localhost:8003",
    siteName: "Conversation Mapper Test",
    fetcher: async (input, init) => {
      capturedUrl = String(input);
      capturedBody = JSON.parse(String(init?.body));
      capturedHeaders = new Headers(init?.headers);
      return jsonResponse("  # Report  ");
    },
  });

  const result = await service.generateMarkdown("make a report", "text");

  assertEquals(result, "# Report");
  assertEquals(capturedUrl, "https://openrouter.ai/api/v1/chat/completions");
  assertEquals(capturedBody.model, "google/gemini-2.5-flash-lite");
  assertEquals(capturedBody.stream, false);
  assertStringIncludes(
    capturedBody.messages[0].content,
    "Transform the following conversation text",
  );
  assertEquals(capturedHeaders?.get("Authorization"), "Bearer test-key");
  assertEquals(capturedHeaders?.get("HTTP-Referer"), "http://localhost:8003");
  assertEquals(
    capturedHeaders?.get("X-OpenRouter-Title"),
    "Conversation Mapper Test",
  );
});

Deno.test("OpenRouter transcribeAudio sends input_audio content", async () => {
  let capturedBody: any = null;
  const audioPart: OpenRouterAudioPart = {
    inputAudio: {
      data: "YXVkaW8=",
      format: "webm",
      mimeType: "audio/webm",
    },
  };

  const service = createOpenRouterService({
    apiKey: "test-key",
    model: "google/gemini-2.5-flash-lite",
    fetcher: async (_input, init) => {
      capturedBody = JSON.parse(String(init?.body));
      return jsonResponse("Speaker1: hello\nSpeaker2: hi");
    },
  });

  const result = await service.transcribeAudio(audioPart);
  const content = capturedBody.messages[0].content;

  assertEquals(result.text, "Speaker1: hello\nSpeaker2: hi");
  assertEquals(result.speakers, ["Speaker1", "Speaker2"]);
  assertEquals(content[0].type, "text");
  assertStringIncludes(content[0].text, "Transcribe this audio file");
  assertEquals(content[1].type, "input_audio");
  assertEquals(content[1].input_audio.data, "YXVkaW8=");
  assertEquals(content[1].input_audio.format, "webm");
});
