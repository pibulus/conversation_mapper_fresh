/**
 * EmojimapViz Island - Topic Graph Visualization
 *
 * Non-chronological topic map showing emoji nodes and their relationships
 */

import { useComputed } from "@preact/signals";
import { conversationData } from "../signals/conversationStore.ts";

export default function EmojimapViz() {
  const nodes = useComputed(() => conversationData.value?.nodes || []);
  const edges = useComputed(() => conversationData.value?.edges || []);

  if (!conversationData.value || nodes.value.length === 0) {
    return (
      <div class="text-center py-12 text-gray-500 italic">
        No topic map yet. Upload a conversation to see the emoji visualization.
      </div>
    );
  }

  return (
    <div class="bg-white rounded-lg border-4 border-soft-blue shadow-brutal p-6">
      <h2 class="text-2xl font-bold text-soft-blue mb-4">
        🕸️ Topic Map
      </h2>

      {/* Topic Nodes */}
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {nodes.value.map((node) => (
          <div
            key={node.id}
            class="flex items-center gap-2 p-3 rounded-lg border-2 hover:border-purple-400 transition-all"
            style={{ borderColor: node.color || '#ccc' }}
          >
            <span class="text-3xl">{node.emoji}</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold truncate">{node.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Connections Summary */}
      {edges.value.length > 0 && (
        <div class="border-t-2 border-gray-200 pt-4">
          <p class="text-sm text-gray-600">
            <strong>{nodes.value.length}</strong> topics connected by{' '}
            <strong>{edges.value.length}</strong> relationships
          </p>
        </div>
      )}
    </div>
  );
}
