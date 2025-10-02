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
      name: "Circular Network",
      icon: "🕸️",
      component: EmojimapViz,
    },
    {
      id: "arc" as VisualizationType,
      name: "Arc Diagram",
      icon: "🌈",
      component: ArcDiagramViz,
    },
    // {
    //   id: "wordcloud" as VisualizationType,
    //   name: "Word Cloud",
    //   icon: "☁️",
    //   component: WordCloudViz,
    // },
  ];

  const ActiveComponent =
    visualizations.find((v) => v.id === activeViz.value)?.component ||
    EmojimapViz;

  return (
    <div class="flex flex-col h-full">
      {/* Tab Selector */}
      <div class="flex gap-2 mb-4 border-b-2 border-purple-200 pb-2">
        {visualizations.map((viz) => (
          <button
            key={viz.id}
            onClick={() => (activeViz.value = viz.id)}
            class={`flex items-center gap-2 px-4 py-2 rounded-t-lg border-2 transition-all font-bold ${
              activeViz.value === viz.id
                ? "bg-purple-500 text-white border-purple-700 shadow-md"
                : "bg-white text-purple-600 border-purple-300 hover:bg-purple-100"
            }`}
          >
            <span class="text-lg">{viz.icon}</span>
            <span class="text-sm">{viz.name}</span>
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
