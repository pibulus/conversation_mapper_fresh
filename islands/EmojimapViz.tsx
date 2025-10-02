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
    <div>
      {/* Topic Nodes */}
      <div class="grid grid-cols-2 gap-3 mb-4">
        {nodes.value.map((node) => (
          <div
            key={node.id}
            class="flex items-center gap-2 p-2 rounded-lg border-2 hover:shadow-md transition-all cursor-pointer"
            style={{ borderColor: node.color || '#cbd5e0' }}
          >
            <span class="text-2xl">{node.emoji}</span>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold truncate">{node.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Connections Summary */}
      {edges.value.length > 0 && (
        <div class="border-t-2 border-gray-200 pt-3">
          <p class="text-xs text-gray-600">
            <strong>{nodes.value.length}</strong> topics · <strong>{edges.value.length}</strong> connections
          </p>
        </div>
      )}
    </div>
  );
}
