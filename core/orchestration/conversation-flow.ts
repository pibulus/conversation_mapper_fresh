/**
 * Conversation Flow Orchestrator
 *
 * Main flow: Audio/Text → Transcription → Parallel AI Analysis → Data
 * This is the nervous system in action
 */

import type { AIService } from '../ai/gemini.ts';
import { analyzeText, analyzeAudio } from './parallel-analysis.ts';
import type {
	Conversation,
	ActionItem,
	Node,
	Edge,
	Transcript,
	NodeInput
} from '../types/index.ts';

export interface ConversationFlowResult {
	conversation: Partial<Conversation>;
	transcript: Partial<Transcript>;
	nodes: Node[];
	edges: Edge[];
	actionItems: ActionItem[];
	summary: string;
	statusUpdates: Array<{
		id: string;
		status: 'completed' | 'pending';
		reason: string;
	}>;
}

/**
 * Process new audio input
 */
export async function processAudio(
	aiService: AIService,
	audioBlob: Blob,
	conversationId: string,
	existingActionItems: ActionItem[] = [],
	existingNodes: NodeInput[] = []
): Promise<ConversationFlowResult> {
	// Parallel AI analysis
	const analysis = await analyzeAudio(aiService, audioBlob, existingActionItems, existingNodes);

	// Generate title from transcription
	const title = await aiService.generateTitle(analysis.transcription.text);

	// Build result
	return {
		conversation: {
			id: conversationId,
			title,
			source: 'audio',
			transcript: analysis.transcription.text
		},
		transcript: {
			id: crypto.randomUUID(),
			conversation_id: conversationId,
			text: analysis.transcription.text,
			speakers: analysis.transcription.speakers,
			source: 'audio',
			created_at: new Date().toISOString()
		},
		nodes: analysis.topics.nodes.map((node) => ({
			id: node.id,
			conversation_id: conversationId,
			label: node.label,
			emoji: node.emoji,
			color: node.color,
			created_at: new Date().toISOString()
		})),
		edges: analysis.topics.edges.map((edge) => ({
			id: crypto.randomUUID(),
			conversation_id: conversationId,
			source_topic_id: edge.source_topic_id,
			target_topic_id: edge.target_topic_id,
			color: edge.color,
			created_at: new Date().toISOString()
		})),
		actionItems: analysis.actionItems.map((item) => ({
			id: crypto.randomUUID(),
			conversation_id: conversationId,
			description: item.description,
			assignee: item.assignee,
			due_date: item.due_date,
			status: 'pending' as const,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		})),
		summary: analysis.summary,
		statusUpdates: analysis.statusUpdates
	};
}

/**
 * Process new text input
 */
export async function processText(
	aiService: AIService,
	text: string,
	conversationId: string,
	speakers: string[] = [],
	existingActionItems: ActionItem[] = [],
	existingNodes: NodeInput[] = []
): Promise<ConversationFlowResult> {
	// Parallel AI analysis
	const analysis = await analyzeText(aiService, text, speakers, existingActionItems, existingNodes);

	// Generate title
	const title = await aiService.generateTitle(text);

	// Build result
	return {
		conversation: {
			id: conversationId,
			title,
			source: 'text',
			transcript: text
		},
		transcript: {
			id: crypto.randomUUID(),
			conversation_id: conversationId,
			text,
			speakers,
			source: 'text',
			created_at: new Date().toISOString()
		},
		nodes: analysis.topics.nodes.map((node) => ({
			id: node.id,
			conversation_id: conversationId,
			label: node.label,
			emoji: node.emoji,
			color: node.color,
			created_at: new Date().toISOString()
		})),
		edges: analysis.topics.edges.map((edge) => ({
			id: crypto.randomUUID(),
			conversation_id: conversationId,
			source_topic_id: edge.source_topic_id,
			target_topic_id: edge.target_topic_id,
			color: edge.color,
			created_at: new Date().toISOString()
		})),
		actionItems: analysis.actionItems.map((item) => ({
			id: crypto.randomUUID(),
			conversation_id: conversationId,
			description: item.description,
			assignee: item.assignee,
			due_date: item.due_date,
			status: 'pending' as const,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		})),
		summary: analysis.summary,
		statusUpdates: analysis.statusUpdates
	};
}

/**
 * Generate summary for conversation
 */
export async function generateSummary(
	aiService: AIService,
	text: string
): Promise<string> {
	return aiService.generateSummary(text);
}

/**
 * Export conversation in different formats
 */
export async function exportConversation(
	aiService: AIService,
	formatPrompt: string,
	text: string
): Promise<string> {
	return aiService.generateMarkdown(formatPrompt, text);
}
