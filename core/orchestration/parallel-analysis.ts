/**
 * Parallel Analysis Coordinator
 *
 * The magic that makes conversation mapper fast:
 * - Topics, action items, and self-checkoff run simultaneously
 * - Efficient API usage
 * - Fast user experience
 */

import type { AIService } from '../ai/gemini.ts';
import type {
	ActionItem,
	ActionItemInput,
	ActionItemStatusUpdate,
	ConversationGraph
} from '../types/index.ts';

export interface AnalysisResult {
	topics: ConversationGraph;
	actionItems: ActionItemInput[];
	statusUpdates: ActionItemStatusUpdate[];
	summary: string;
}

/**
 * Run parallel AI analysis on new text
 */
export async function analyzeText(
	aiService: AIService,
	text: string,
	speakers: string[] = [],
	existingActionItems: ActionItem[] = []
): Promise<AnalysisResult> {
	// Run all AI operations in parallel
	const [topics, actionItems, statusUpdates, summary] = await Promise.all([
		aiService.extractTopics(text),
		aiService.extractActionItems(text, speakers),
		existingActionItems.length > 0
			? aiService.checkActionItemStatus(text, existingActionItems)
			: Promise.resolve([]),
		aiService.generateSummary(text)
	]);

	return {
		topics,
		actionItems,
		statusUpdates,
		summary
	};
}

/**
 * Run parallel AI analysis on new audio
 */
export async function analyzeAudio(
	aiService: AIService,
	audioBlob: Blob,
	existingActionItems: ActionItem[] = []
): Promise<AnalysisResult & { transcription: { text: string; speakers: string[] } }> {
	// First transcribe the audio
	const transcription = await aiService.transcribeAudio(audioBlob);

	// Then run parallel analysis on the transcribed text
	const [topics, actionItems, statusUpdates, summary] = await Promise.all([
		aiService.extractTopics(transcription.text),
		aiService.extractActionItems(audioBlob, transcription.speakers),
		existingActionItems.length > 0
			? aiService.checkActionItemStatus(audioBlob, existingActionItems)
			: Promise.resolve([]),
		aiService.generateSummary(transcription.text)
	]);

	return {
		transcription,
		topics,
		actionItems,
		statusUpdates,
		summary
	};
}
