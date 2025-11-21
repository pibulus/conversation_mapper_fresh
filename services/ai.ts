/**
 * Shared Gemini helpers to keep server routes consistent.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createGeminiService } from "@core/ai/gemini.ts";
import type { AIService } from "@core/ai/gemini.ts";

const DEFAULT_MODEL = "gemini-2.5-flash-lite";
const modelName = Deno.env.get("GEMINI_MODEL") ?? DEFAULT_MODEL;

let cachedKey: string | null = null;
let cachedModel: ReturnType<GoogleGenerativeAI["getGenerativeModel"]> | null =
  null;
let cachedService: AIService | null = null;

function requireApiKey(): string {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
  }
  return apiKey;
}

function buildModel(apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

export function getGeminiModel() {
  const apiKey = requireApiKey();
  if (!cachedModel || cachedKey !== apiKey) {
    cachedModel = buildModel(apiKey);
    cachedKey = apiKey;
    cachedService = null;
  }
  return cachedModel;
}

export function getGeminiService(): AIService {
  if (!cachedService) {
    cachedService = createGeminiService(getGeminiModel());
  }
  return cachedService;
}

export function getGeminiModelName() {
  return modelName;
}

export function getGeminiApiKey() {
  return requireApiKey();
}
