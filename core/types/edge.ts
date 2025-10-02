/**
 * Edge Types (topic relationships)
 */

export interface Edge {
	id: string;
	conversation_id: string;
	source_topic_id: string;
	target_topic_id: string;
	color: string; // Hex color like "#999999"
	created_at: string;
}

export interface EdgeInput {
	source_topic_id: string;
	target_topic_id: string;
	color: string;
}
