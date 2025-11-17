/**
 * Conversation Processing API Route
 *
 * Accepts audio or text input and processes it through the nervous system
 * Returns: conversation data, transcript, nodes, edges, action items
 */

import { Handlers } from "$fresh/server.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createGeminiService } from "@core/ai/gemini.ts";
import { processText, processAudio } from "@core/orchestration/conversation-flow.ts";

// ===================================================================
// RATE LIMITING
// ===================================================================

const rateLimiter = new Map<string, number[]>();
const MAX_REQUESTS = 10; // per minute
const WINDOW_MS = 60000; // 1 minute

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
         req.headers.get("x-real-ip") ||
         "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const requests = rateLimiter.get(ip) || [];

  // Filter out requests outside the window
  const recentRequests = requests.filter(timestamp => now - timestamp < WINDOW_MS);

  if (recentRequests.length >= MAX_REQUESTS) {
    return false;
  }

  // Add current request
  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);

  // Cleanup old entries periodically
  if (Math.random() < 0.01) {
    for (const [key, timestamps] of rateLimiter.entries()) {
      const validTimestamps = timestamps.filter(t => now - t < WINDOW_MS);
      if (validTimestamps.length === 0) {
        rateLimiter.delete(key);
      } else {
        rateLimiter.set(key, validTimestamps);
      }
    }
  }

  return true;
}

export const handler: Handlers = {
  async POST(req) {
    try {
      // Rate limiting check
      const clientIP = getClientIP(req);
      if (!checkRateLimit(clientIP)) {
        return new Response(
          JSON.stringify({
            error: "Too many requests. Please wait a moment and try again.",
            retryAfter: 60
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": "60"
            }
          }
        );
      }
      const contentType = req.headers.get("content-type") || "";

      // Initialize Gemini AI
      const apiKey = Deno.env.get("GEMINI_API_KEY");
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Missing GEMINI_API_KEY environment variable" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const aiService = createGeminiService(model);

      const conversationId = crypto.randomUUID();

      // ===============================================================
      // AUDIO UPLOAD PROCESSING
      // ===============================================================

      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File;

        if (!audioFile) {
          return new Response(
            JSON.stringify({ error: "No audio file provided" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Validate file size (50MB max to prevent abuse)
        const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
        if (audioFile.size > MAX_FILE_SIZE) {
          return new Response(
            JSON.stringify({ error: `File too large. Maximum size is 50MB (received ${(audioFile.size / 1024 / 1024).toFixed(1)}MB)` }),
            { status: 413, headers: { "Content-Type": "application/json" } }
          );
        }

        // Convert File to Blob for nervous system
        const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type });

        // Process through nervous system
        const result = await processAudio(aiService, audioBlob, conversationId);

        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" }
        });
      }

      // ===============================================================
      // TEXT INPUT PROCESSING
      // ===============================================================

      const body = await req.json();
      const { text, speakers = [] } = body;

      if (!text) {
        return new Response(
          JSON.stringify({ error: "No text provided" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Process through nervous system
      const result = await processText(aiService, text, conversationId, speakers);

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      console.error("❌ Processing error:", error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error"
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
};
