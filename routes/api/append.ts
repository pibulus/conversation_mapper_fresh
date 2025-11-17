/**
 * Append Audio API Route
 *
 * Appends new audio to an existing conversation
 * - Transcribes audio
 * - Appends transcript
 * - Re-analyzes action items with smart completion detection
 * - Updates topics if needed
 * - Returns updated conversation data
 */

import { Handlers } from "$fresh/server.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createGeminiService } from "@core/ai/gemini.ts";
import { processAudio } from "@core/orchestration/conversation-flow.ts";
import type { ConversationFlowResult } from "@core/orchestration/conversation-flow.ts";
import type { ActionItem } from "@core/types/index.ts";

/**
 * Format timestamp for append operations
 */
function formatAppendTimestamp(date: Date = new Date()): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Create a professional section divider for appended content
 */
function createSectionDivider(recordingNumber: number, timestamp: string): string {
  const divider = '─'.repeat(60);
  return `\n\n${divider}\n📎 Recording #${recordingNumber} • ${timestamp}\n${divider}\n\n`;
}

/**
 * Check if two action items are duplicates
 * Simple normalized string comparison - AI-generated items are already consistent
 */
function areSimilarActionItems(desc1: string, desc2: string): boolean {
  const normalize = (text: string) =>
    text.toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace

  return normalize(desc1) === normalize(desc2);
}

/**
 * Append Audio API Handler
 *
 * Processes new audio recordings and appends them to existing conversations.
 * Features smart deduplication, status tracking, and professional formatting.
 *
 * @returns {Response} JSON response with updated conversation data
 */
export const handler: Handlers = {
  async POST(req) {
    try {
      const contentType = req.headers.get("content-type") || "";

      if (!contentType.includes("multipart/form-data")) {
        return new Response(
          JSON.stringify({ error: "Expected multipart/form-data" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

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

      // Parse form data
      const formData = await req.formData();
      const audioFile = formData.get("audio") as File;
      const conversationId = formData.get("conversationId") as string;
      const existingTranscript = formData.get("existingTranscript") as string | null;
      const existingActionItemsJson = formData.get("existingActionItems") as string | null;
      const existingSummary = formData.get("existingSummary") as string | null;
      const existingNodesJson = formData.get("existingNodes") as string | null;

      if (!audioFile) {
        return new Response(
          JSON.stringify({ error: "No audio file provided" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (!conversationId) {
        return new Response(
          JSON.stringify({ error: "No conversation ID provided" }),
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

      // Parse existing action items for smart completion detection
      let existingActionItems: ActionItem[] = [];
      if (existingActionItemsJson) {
        try {
          existingActionItems = JSON.parse(existingActionItemsJson);
        } catch (error) {
          console.warn("Failed to parse existing action items:", error);
        }
      }

      // Parse existing nodes for topic deduplication
      let existingNodes: any[] = [];
      if (existingNodesJson) {
        try {
          existingNodes = JSON.parse(existingNodesJson);
        } catch (error) {
          console.warn("Failed to parse existing nodes:", error);
        }
      }

      // Convert File to Blob
      const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type });

      // Process audio through nervous system with existing action items and nodes
      console.log(`📎 Appending audio to conversation ${conversationId}`);
      console.log(`📋 Found ${existingActionItems.length} existing action items`);
      console.log(`🕸️ Found ${existingNodes.length} existing topics`);

      const result: ConversationFlowResult = await processAudio(
        aiService,
        audioBlob,
        conversationId,
        existingActionItems,
        existingNodes
      );

      // Calculate recording number based on existing content
      const recordingNumber = existingTranscript
        ? (existingTranscript.match(/📎 Recording #/g) || []).length + 1
        : 1;
      const timestamp = formatAppendTimestamp();

      // Merge transcripts with professional formatting
      if (existingTranscript) {
        const divider = createSectionDivider(recordingNumber, timestamp);
        const combinedTranscript = `${existingTranscript}${divider}${result.transcript.text}`;
        result.transcript.text = combinedTranscript;
        result.conversation.transcript = combinedTranscript;
      }

      // Append summaries with context and timestamp
      if (existingSummary && result.summary) {
        const updateHeader = `\n\n### 📝 Update #${recordingNumber} — ${timestamp}\n\n`;
        result.summary = `${existingSummary}${updateHeader}${result.summary}`;
      }

      // Process status updates from AI analysis
      // These tell us which action items were marked as complete in the new audio
      console.log(`✅ Status updates detected: ${result.statusUpdates.length}`);

      // Update existing action items with completion status
      const updatedActionItems = result.actionItems.map(item => {
        const statusUpdate = result.statusUpdates.find(
          update => update.id === item.id
        );

        // Handle bi-directional status updates (completed ↔ pending)
        if (statusUpdate) {
          if (statusUpdate.status === 'completed') {
            console.log(`✓ Marking action item as completed: ${item.description}`);
            return {
              ...item,
              status: 'completed' as const,
              updated_at: new Date().toISOString(),
              ai_checked: true,
              checked_reason: statusUpdate.reason
            };
          } else if (statusUpdate.status === 'pending') {
            console.log(`↺ Reverting action item to pending: ${item.description}`);
            return {
              ...item,
              status: 'pending' as const,
              updated_at: new Date().toISOString(),
              ai_checked: true,
              checked_reason: statusUpdate.reason
            };
          }
        }

        return item;
      });

      // Merge action items (keep existing + add new ones)
      // Remove duplicates based on description similarity
      const mergedActionItems = [...existingActionItems];

      for (const newItem of updatedActionItems) {
        const isDuplicate = mergedActionItems.some(
          existing => areSimilarActionItems(existing.description, newItem.description)
        );

        if (!isDuplicate) {
          mergedActionItems.push(newItem);
        } else {
          console.log(`⏭️  Skipping duplicate action item: "${newItem.description}"`);
        }
      }

      console.log(`📊 Final action items: ${mergedActionItems.length} total`);
      console.log(`   - ${mergedActionItems.filter(i => i.status === 'completed').length} completed`);
      console.log(`   - ${mergedActionItems.filter(i => i.status === 'pending').length} pending`);

      // Build final result
      const finalResult = {
        ...result,
        actionItems: mergedActionItems
      };

      return new Response(JSON.stringify(finalResult), {
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      console.error("❌ Append error:", error);

      // Provide helpful, actionable error messages
      let errorMessage = "Failed to append recording";
      let suggestion = "Please try again";
      let statusCode = 500;

      if (error instanceof Error) {
        // API key issues
        if (error.message.includes("API key") || error.message.includes("GEMINI_API_KEY")) {
          errorMessage = "AI service configuration error";
          suggestion = "Please check that your GEMINI_API_KEY is set correctly";
          statusCode = 503;
        }
        // Network/timeout issues
        else if (error.message.includes("fetch") || error.message.includes("network") || error.message.includes("timeout")) {
          errorMessage = "Network connection error";
          suggestion = "Check your internet connection and try again";
          statusCode = 503;
        }
        // Audio format issues
        else if (error.message.includes("audio") || error.message.includes("format") || error.message.includes("codec")) {
          errorMessage = "Audio format not supported";
          suggestion = "Try recording again or use a different browser";
          statusCode = 415;
        }
        // File size issues (already handled above, but just in case)
        else if (error.message.includes("size") || error.message.includes("large")) {
          errorMessage = "Recording too large";
          suggestion = "Try a shorter recording (max 50MB)";
          statusCode = 413;
        }
        // Generic fallback with actual error
        else {
          errorMessage = `Processing failed: ${error.message}`;
          suggestion = "Try again or contact support if this persists";
        }
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          suggestion,
          details: error instanceof Error ? error.message : "Unknown error"
        }),
        { status: statusCode, headers: { "Content-Type": "application/json" } }
      );
    }
  }
};
