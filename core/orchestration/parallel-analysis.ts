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
	ConversationGraph,
	NodeInput
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
	existingActionItems: ActionItem[] = [],
	existingNodes: NodeInput[] = []
): Promise<AnalysisResult> {
	// Run all AI operations in parallel
	const [topics, actionItems, statusUpdates, summary] = await Promise.all([
		aiService.extractTopics(text, existingNodes),
		aiService.extractActionItems(text, speakers, existingActionItems),
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
	existingActionItems: ActionItem[] = [],
	existingNodes: NodeInput[] = []
): Promise<AnalysisResult & { transcription: { text: string; speakers: string[] } }> {
	// First transcribe the audio
	const transcription = await aiService.transcribeAudio(audioBlob);

	// Then run parallel analysis on the transcribed text
	const [topics, actionItems, statusUpdates, summary] = await Promise.all([
		aiService.extractTopics(transcription.text, existingNodes),
		aiService.extractActionItems(audioBlob, transcription.speakers, existingActionItems),
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
