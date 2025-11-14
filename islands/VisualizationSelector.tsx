/**
 * Visualization Selector - Tab Switcher for Different Viz Types
 *
 * Allows users to switch between different visualization styles:
 * - Circular Network (EmojimapViz)
 * - Arc Diagram (ArcDiagramViz)
 * - Word Cloud (coming soon)
 */

import { useSignal } from "@preact/signals";
import EmojimapViz from "./EmojimapViz.tsx";
import ArcDiagramViz from "./ArcDiagramViz.tsx";

type VisualizationType = "circular" | "arc" | "wordcloud";

export default function VisualizationSelector() {
  const activeViz = useSignal<VisualizationType>("circular");

  const visualizations = [
    {
      id: "circular" as VisualizationType,
      name: "Circular",
      component: EmojimapViz,
    },
    {
      id: "arc" as VisualizationType,
      name: "Arc",
      component: ArcDiagramViz,
    },
    // {
    //   id: "wordcloud" as VisualizationType,
    //   name: "Cloud",
    //   component: WordCloudViz,
    // },
  ];

  const ActiveComponent =
    visualizations.find((v) => v.id === activeViz.value)?.component ||
    EmojimapViz;

  return (
    <div class="flex flex-col h-full">
      {/* Tab Selector */}
      <div class="flex gap-2 mb-4">
        {visualizations.map((viz) => (
          <button
            key={viz.id}
            onClick={() => (activeViz.value = viz.id)}
            class={`mode-tab ${activeViz.value === viz.id ? 'active' : ''}`}
            aria-pressed={activeViz.value === viz.id}
          >
            {viz.name}
          </button>
        ))}
      </div>

      {/* Visualization Container */}
      <div class="flex-1 min-h-0">
        <ActiveComponent />
      </div>
    </div>
  );
}
