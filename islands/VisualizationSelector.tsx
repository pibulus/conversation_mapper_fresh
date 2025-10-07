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
      <div class="flex gap-2 mb-4 pb-2" style={{
        borderBottom: `2px solid var(--color-border)`
      }}>
        {visualizations.map((viz) => (
          <button
            key={viz.id}
            onClick={() => (activeViz.value = viz.id)}
            class="flex items-center gap-2 px-4 py-2 rounded-t-lg"
            style={{
              border: `2px solid var(--color-border)`,
              background: activeViz.value === viz.id ? 'var(--color-accent)' : 'var(--color-secondary)',
              color: activeViz.value === viz.id ? 'white' : 'var(--color-text)',
              fontWeight: activeViz.value === viz.id ? 'var(--heading-weight)' : 'var(--text-weight)',
              fontSize: 'var(--text-size)',
              transition: 'var(--transition-medium)',
              boxShadow: activeViz.value === viz.id ? 'var(--shadow-soft)' : 'none'
            }}
          >
            <span class="text-lg">{viz.icon}</span>
            <span style={{ fontSize: 'var(--text-size)' }}>{viz.name}</span>
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
