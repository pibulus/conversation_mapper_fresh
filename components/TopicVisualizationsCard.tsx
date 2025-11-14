/**
 * TopicVisualizationsCard Component
 * Wrapper card for topic visualizations
 */

import VisualizationSelector from "../islands/VisualizationSelector.tsx";

export default function TopicVisualizationsCard() {
  return (
    <div class="w-full lg:col-span-3">
      <div class="dashboard-card">
        <div class="dashboard-card-header">
          <h3>Topic Visualizations</h3>
        </div>
        <div style={{ padding: 'var(--card-padding)', minHeight: '500px' }}>
          <VisualizationSelector />
        </div>
      </div>
    </div>
  );
}
