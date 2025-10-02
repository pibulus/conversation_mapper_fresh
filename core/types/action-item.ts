/**
 * Action Item Types
 */

export interface ActionItem {
	id: string;
	conversation_id: string;
	description: string;
	assignee: string | null;
	due_date: string | null; // YYYY-MM-DD format
	status: 'pending' | 'completed';
	created_at: string;
	updated_at: string;
	ai_checked?: boolean; // Was this updated by AI?
	checked_reason?: string; // Why AI updated it
}

export interface ActionItemStatusUpdate {
	id: string;
	description: string;
	status: 'completed' | 'pending';
	reason: string; // AI's explanation for the change
}

export interface ActionItemInput {
	description: string;
	assignee: string | null;
	due_date: string | null;
}
