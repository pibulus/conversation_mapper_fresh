/**
 * Export Transformer
 *
 * Transform conversations into various formats
 */

import type { AIService } from '../ai/gemini.ts';
import { EXPORT_FORMATS } from './formats.ts';

export interface ExportResult {
	format: string;
	content: string;
	timestamp: string;
}

/**
 * Transform conversation using a predefined format
 */
export async function transformConversation(
	aiService: AIService,
	format: keyof typeof EXPORT_FORMATS,
	conversationText: string
): Promise<ExportResult> {
	const formatPrompt = EXPORT_FORMATS[format];
	const content = await aiService.generateMarkdown(formatPrompt, conversationText);

	return {
		format: format.toLowerCase().replace('_', '-'),
		content,
		timestamp: new Date().toISOString()
	};
}

/**
 * Transform conversation using a custom prompt
 */
export async function transformWithCustomPrompt(
	aiService: AIService,
	customPrompt: string,
	conversationText: string
): Promise<ExportResult> {
	const content = await aiService.generateMarkdown(customPrompt, conversationText);

	return {
		format: 'custom',
		content,
		timestamp: new Date().toISOString()
	};
}
