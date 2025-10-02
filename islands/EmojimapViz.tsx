/**
 * EmojimapViz Island - Topic Graph Visualization
 *
 * Non-chronological topic map showing emoji nodes and their relationships
 */

import { useComputed } from "@preact/signals";
import { conversationData } from "../signals/conversationStore.ts";
import CircularNetworkGraph from "./CircularNetworkGraph.tsx";

export default function EmojimapViz() {
  const nodes = useComputed(() => conversationData.value?.nodes || []);
  const loading = useComputed(() => false); // TODO: Connect to loading state

  if (!conversationData.value || nodes.value.length === 0) {
    return (
      <div class="text-center py-12 text-gray-500 italic">
        No topic map yet. Upload a conversation to see the emoji visualization.
      </div>
    );
  }

  return <CircularNetworkGraph loading={loading.value} />;
}
