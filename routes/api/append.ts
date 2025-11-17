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
 * Check if two action items are similar enough to be considered duplicates
 * Uses token-based similarity with normalized text
 */
function areSimilarActionItems(desc1: string, desc2: string): boolean {
  const normalize = (text: string) =>
    text.toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize whitespace

  const text1 = normalize(desc1);
  const text2 = normalize(desc2);

  // Exact match after normalization
  if (text1 === text2) return true;

  // Check if one is a substring of the other (handles "fix bug" vs "fix the bug")
  if (text1.includes(text2) || text2.includes(text1)) return true;

  // Token-based similarity
  const tokens1 = text1.split(' ').filter(t => t.length > 2); // Ignore short words
  const tokens2 = text2.split(' ').filter(t => t.length > 2);

  if (tokens1.length === 0 || tokens2.length === 0) return false;

  // Calculate Jaccard similarity (intersection / union)
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  const similarity = intersection.size / union.size;

  // Consider similar if >60% token overlap
  return similarity > 0.6;
}

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

      // Merge transcripts if we have existing content
      if (existingTranscript) {
        const combinedTranscript = `${existingTranscript}\n\n--- New Recording ---\n\n${result.transcript.text}`;
        result.transcript.text = combinedTranscript;
        result.conversation.transcript = combinedTranscript;
      }

      // Append summaries if we have existing summary
      if (existingSummary && result.summary) {
        result.summary = `${existingSummary}\n\n**Update from latest recording:**\n${result.summary}`;
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
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error"
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
};
