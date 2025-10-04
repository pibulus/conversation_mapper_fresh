/**
 * Gemini AI Service
 *
 * Handles markdown generation using Google's Gemini API
 * Ported from Svelte conversation_mapper version
 */

// Note: Using Google Generative AI SDK
// Install with: npm install @google/generative-ai
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

// Get API key from environment
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

if (!GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY not set. Markdown generation will fail.');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI?.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

export const geminiService = {
  /**
   * Generate markdown from conversation text using a custom prompt
   */
  async generateMarkdown(prompt: string, text: string): Promise<string> {
    if (!model) {
      throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY environment variable.');
    }

    try {
      console.log('📝 Generating markdown with Gemini');

      const fullPrompt = `Transform the following conversation text according to these instructions:

${prompt}

Return the result in markdown format, properly formatted and structured.
Only return the markdown content, no additional text or explanations.
Use proper markdown syntax including headers, lists, code blocks, etc as appropriate.

CONVERSATION TEXT:
${text}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const markdown = response.text().trim();

      console.log('✅ Markdown generation complete');
      return markdown;
    } catch (error) {
      console.error('❌ Error generating markdown:', error);
      throw new Error('Failed to generate markdown with Gemini');
    }
  }
};
