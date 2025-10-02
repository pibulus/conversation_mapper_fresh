/**
 * Transcript Types
 */

export interface Transcript {
	id: string;
	conversation_id: string;
	text: string;
	speakers: string[];
	source: 'audio' | 'text'; // How it was created
	created_at: string;
}

export interface TranscriptionResult {
	text: string;
	speakers: string[];
}
