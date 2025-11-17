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
      <div class="dashboard-skeleton-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div class="skeleton dashboard-skeleton-card skeleton-pulse" key={index}>
            <div class="skeleton-line skeleton-lg"></div>
            <div class="skeleton-line" style="width: 70%"></div>
            <div class="skeleton-line" style="width: 85%"></div>
            <div class="skeleton-line" style="width: 55%"></div>
          </div>
        ))}
      </div>
    );
  }

  // Handler to update action items
  function handleUpdateActionItems(updatedItems: any[]) {
    if (!conversationData.value) return;

    // Create completely new object to ensure signal reactivity
    const currentData = conversationData.value;
    conversationData.value = {
      conversation: { ...currentData.conversation },
      transcript: { ...currentData.transcript },
      nodes: [...currentData.nodes],
      edges: [...currentData.edges],
      actionItems: updatedItems,
      statusUpdates: currentData.statusUpdates ? [...currentData.statusUpdates] : [],
      summary: currentData.summary
    };
  }

  // Access signal properties directly in render to maintain reactivity
  const data = conversationData.value;
  const { conversation, transcript, nodes, summary } = data;
  const actionItems = data.actionItems;

  return (
    <div>
      {/* Grid Container - Simple CSS Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'clamp(1rem, 2.5vw, 1.5rem)' }}>

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
