/**
 * Dashboard Island - Simplified with Extracted Components
 *
 * Clean grid layout coordinating cards
 */

import { conversationData } from "../signals/conversationStore.ts";
import TranscriptCard from "../components/TranscriptCard.tsx";
import SummaryCard from "../components/SummaryCard.tsx";
import ActionItemsCard from "../components/ActionItemsCard.tsx";
import TopicVisualizationsCard from "../components/TopicVisualizationsCard.tsx";

export default function DashboardIsland() {
  if (!conversationData.value) {
    return (
      <div class="text-center py-12">
        <p class="text-gray-500">No conversation data yet. Upload audio or text to begin.</p>
      </div>
    );
  }

  const { conversation, transcript, actionItems, nodes, summary } = conversationData.value;

  // Handler to update action items
  function handleUpdateActionItems(updatedItems: typeof actionItems) {
    conversationData.value = {
      ...conversationData.value!,
      actionItems: updatedItems
    };
  }

  return (
    <div>
      {/* Grid Container - Simple CSS Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

        {/* Card 1: Transcript */}
        <TranscriptCard transcript={transcript} />

        {/* Card 2: Summary */}
        <SummaryCard
          summary={summary}
          nodes={nodes}
          conversationSource={conversation.source}
        />

        {/* Card 3: Action Items */}
        <ActionItemsCard
          actionItems={actionItems}
          onUpdateItems={handleUpdateActionItems}
        />

        {/* Card 4: Topic Visualizations - FULL WIDTH (spans all columns) */}
        <TopicVisualizationsCard />

      </div>
    </div>
  );
}
