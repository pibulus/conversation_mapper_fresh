/**
 * Topic Node Types (for conversation graph)
 */

export interface Node {
	id: string;
	conversation_id: string;
	label: string;
	emoji: string;
	color: string; // Hex color like "#4287f5"
	position?: {
		x: number;
		y: number;
	};
	created_at: string;
}

export interface NodeInput {
	id: string;
	label: string;
	color: string;
	emoji: string;
}
