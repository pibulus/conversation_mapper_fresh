/**
 * Gemini API Route
 *
 * Server-side endpoint for Gemini API calls
 * Keeps API key secure, never exposed to client
 */

import { FreshContext } from "$fresh/server.ts";
import { guardRequest } from "@services/requestGuard.ts";
import { getGeminiModel } from "@services/ai.ts";

export const handler = async (req: Request, _ctx: FreshContext) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const guardResponse = guardRequest(req);
  if (guardResponse) {
    return guardResponse;
  }

  try {
    const { prompt, text } = await req.json();

    if (!prompt || !text) {
      return new Response(
        JSON.stringify({ error: "Missing prompt or text" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const model = getGeminiModel();

    // Generate markdown
    const fullPrompt =
      `Transform the following conversation text according to these instructions:

${prompt}

Return the result in markdown format, properly formatted and structured.
Only return the markdown content, no additional text or explanations.
Use proper markdown syntax including headers, lists, code blocks, etc as appropriate.

CONVERSATION TEXT:
${text}`;

    console.log("📝 Generating markdown with Gemini");

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const markdown = response.text().trim();

    console.log("✅ Markdown generation complete");

    return new Response(
      JSON.stringify({ markdown }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("❌ Error in Gemini API:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate markdown",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
