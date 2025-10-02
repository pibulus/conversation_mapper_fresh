/**
 * Gemini AI Service - Framework Agnostic
 *
 * Pure TypeScript wrapper for Google's Generative AI
 * Can be used in any environment (Node, Deno, Browser)
 */

import type {
	ActionItemInput,
	ActionItemStatusUpdate,
	TranscriptionResult,
	ConversationGraph
} from '../types/index.ts';

import {
	TRANSCRIPTION_PROMPT,
	buildActionItemsPrompt,
	buildActionItemStatusPrompt,
	buildTitlePrompt,
	buildTopicExtractionPrompt,
	buildSummaryPrompt,
	buildMarkdownTransformPrompt
} from './prompts.ts';

// ===================================================================
// UTILITIES
// ===================================================================

/**
 * Convert blob to generative part format
 */
async function blobToGenerativePart(blob: Blob): Promise<{
	inlineData: { data: string; mimeType: string };
}> {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onloadend = () => {
			const base64data = (reader.result as string).split(',')[1];
			resolve({
				inlineData: {
					data: base64data,
					mimeType: blob.type
				}
			});
		};
		reader.readAsDataURL(blob);
	});
}

/**
 * Extract speaker names from transcript
 */
function extractSpeakers(text: string): string[] {
	const speakerSet = new Set<string>();
	const lines = text.split('\n');
	lines.forEach((line) => {
		const match = line.match(/^([\w\s]+):/);
		if (match) {
			speakerSet.add(match[1].trim());
		}
	});
	return Array.from(speakerSet);
}

/**
 * Clean JSON response (removes markdown code blocks)
 */
function cleanJsonResponse(text: string): string {
	return text
		.trim()
		.replace(/^```(json)?\s*/, '')
		.replace(/\s*```$/, '');
}

// ===================================================================
// AI SERVICE
// ===================================================================

export interface AIService {
	transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult>;
	generateTitle(transcript: string): Promise<string>;
	extractActionItems(
		input: string | Blob,
		speakers?: string[]
	): Promise<ActionItemInput[]>;
	checkActionItemStatus(
		input: string | Blob,
		existingActionItems: any[]
	): Promise<ActionItemStatusUpdate[]>;
	extractTopics(text: string): Promise<ConversationGraph>;
	generateSummary(text: string): Promise<string>;
	generateMarkdown(formatPrompt: string, text: string): Promise<string>;
}

/**
 * Create Gemini AI Service
 */
export function createGeminiService(model: any): AIService {
	return {
		// ===============================================================
		// TRANSCRIPTION
		// ===============================================================

		async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
			try {
				const audioPart = await blobToGenerativePart(audioBlob);
				const result = await model.generateContent([TRANSCRIPTION_PROMPT, audioPart]);
				const transcriptText = result.response.text().trim();
				const speakers = extractSpeakers(transcriptText);
				return { text: transcriptText, speakers };
			} catch (error) {
				console.error('❌ Error transcribing audio:', error);
				throw new Error('Failed to transcribe audio with Gemini');
			}
		},

		// ===============================================================
		// TITLE GENERATION
		// ===============================================================

		async generateTitle(transcript: string): Promise<string> {
			try {
				const prompt = buildTitlePrompt(transcript);
				const result = await model.generateContent(prompt);
				const response = await result.response;
				return response.text().trim();
			} catch (error) {
				console.error('❌ Error generating title:', error);
				throw new Error('Failed to generate title with Gemini');
			}
		},

		// ===============================================================
		// ACTION ITEMS
		// ===============================================================

		async extractActionItems(
			input: string | Blob,
			speakers: string[] = []
		): Promise<ActionItemInput[]> {
			try {
				const prompt = buildActionItemsPrompt(input, speakers);

				let result;
				if (input instanceof Blob) {
					const audioPart = await blobToGenerativePart(input);
					result = await model.generateContent([prompt, audioPart]);
				} else {
					result = await model.generateContent(prompt);
				}

				const text = result.response.text();
				const cleanedText = cleanJsonResponse(text);

				try {
					const actionItems = JSON.parse(cleanedText);
					return actionItems.map((item: any) => ({
						description:
							item.description.charAt(0).toUpperCase() + item.description.slice(1),
						assignee: item.assignee === 'null' ? null : item.assignee,
						due_date: item.due_date === 'null' ? null : item.due_date
					}));
				} catch (e) {
					console.error('Error parsing action items JSON:', e);
					console.error('Raw text was:', text);
					return [];
				}
			} catch (error) {
				console.error('Error extracting action items:', error);
				return [];
			}
		},

		// ===============================================================
		// AI SELF-CHECKOFF (The Magic!)
		// ===============================================================

		async checkActionItemStatus(
			input: string | Blob,
			existingActionItems: any[]
		): Promise<ActionItemStatusUpdate[]> {
			try {
				if (!existingActionItems || existingActionItems.length === 0) {
					return [];
				}

				const prompt = buildActionItemStatusPrompt(existingActionItems);

				let result;
				if (input instanceof Blob) {
					const audioPart = await blobToGenerativePart(input);
					result = await model.generateContent([prompt, audioPart]);
				} else {
					result = await model.generateContent(`${prompt}\n\nText: ${input}`);
				}

				const text = result.response.text();
				const cleanedText = cleanJsonResponse(text);

				if (cleanedText.trim() === '[]') {
					return [];
				}

				try {
					return JSON.parse(cleanedText);
				} catch (e) {
					console.error('Error parsing action item status JSON:', e);
					console.error('Raw text was:', text);
					return [];
				}
			} catch (error) {
				console.error('Error checking action item status:', error);
				return [];
			}
		},

		// ===============================================================
		// TOPIC/NODE EXTRACTION
		// ===============================================================

		async extractTopics(text: string): Promise<ConversationGraph> {
			if (!text) return { nodes: [], edges: [] };

			try {
				const prompt = buildTopicExtractionPrompt(text);
				const result = await model.generateContent(prompt);
				const response = await result.response;
				let jsonString = response.text();

				jsonString = cleanJsonResponse(jsonString);
				jsonString = jsonString.replace(/^.*?({.*}).*?$/, '$1');

				try {
					const data = JSON.parse(jsonString);
					return {
						nodes: data.nodes || [],
						edges: data.edges || []
					};
				} catch (e) {
					console.error('Error parsing JSON response', e, jsonString);
					return { nodes: [], edges: [] };
				}
			} catch (error) {
				console.error('Error extracting topics:', error);
				return { nodes: [], edges: [] };
			}
		},

		// ===============================================================
		// SUMMARY
		// ===============================================================

		async generateSummary(text: string): Promise<string> {
			try {
				const prompt = buildSummaryPrompt(text);
				const result = await model.generateContent(prompt);
				const response = await result.response.text();
				return response.trim();
			} catch (error) {
				console.error('Error generating summary:', error);
				throw new Error('Failed to generate summary with Gemini');
			}
		},

		// ===============================================================
		// EXPORT TRANSFORMATION
		// ===============================================================

		async generateMarkdown(formatPrompt: string, text: string): Promise<string> {
			try {
				const prompt = buildMarkdownTransformPrompt(formatPrompt, text);
				const result = await model.generateContent(prompt);
				const response = await result.response;
				return response.text().trim();
			} catch (error) {
				console.error('Error generating markdown:', error);
				throw new Error('Failed to generate markdown with Gemini');
			}
		}
	};
}
