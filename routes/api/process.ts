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

export const handler: Handlers = {
  async POST(req) {
    try {
      const contentType = req.headers.get("content-type") || "";

      // Initialize Gemini AI
      const apiKey = Deno.env.get("VITE_GEMINI_API_KEY");
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "Missing VITE_GEMINI_API_KEY environment variable" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
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
