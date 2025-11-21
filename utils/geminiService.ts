import { ensureApiSession } from "./apiAuth.ts";
import { enqueueApiRequest } from "./requestQueue.ts";

/**
 * Gemini AI Service
 *
 * Client-side service that calls server API route for Gemini
 * API key stays server-side, never exposed to client
 */

export const geminiService = {
  /**
   * Generate markdown from conversation text using a custom prompt
   */
  async generateMarkdown(prompt: string, text: string): Promise<string> {
    try {
      console.log("📝 Generating markdown with Gemini");

      await ensureApiSession();
      const data = await enqueueApiRequest(async ({ signal }) => {
        const response = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, text }),
          signal,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to generate markdown");
        }

        return response.json();
      });
      console.log("✅ Markdown generation complete");
      return data.markdown;
    } catch (error) {
      console.error("❌ Error generating markdown:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to generate markdown with Gemini",
      );
    }
  },
};
