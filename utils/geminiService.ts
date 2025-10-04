/**
 * Gemini AI Service
 *
 * Handles markdown generation using Google's Gemini API
 * Ported from Svelte conversation_mapper version
 */

// Note: Using Google Generative AI SDK
// Install with: npm install @google/generative-ai
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

// Load API key from environment (Fresh/Deno doesn't auto-inject VITE_ vars)
const GEMINI_API_KEY = Deno.env.get("VITE_GEMINI_API_KEY") || "";

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

// Lazy initialize to avoid breaking the app if SDK fails
function getModel() {
  if (!model && GEMINI_API_KEY) {
    try {
      genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    } catch (err) {
      console.error('Failed to initialize Gemini:', err);
    }
  }
  return model;
}

export const geminiService = {
  /**
   * Generate markdown from conversation text using a custom prompt
   */
  async generateMarkdown(prompt: string, text: string): Promise<string> {
    const modelInstance = getModel();

    if (!modelInstance) {
      throw new Error('Gemini API not available. Please check your API key.');
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

      const result = await modelInstance.generateContent(fullPrompt);
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
