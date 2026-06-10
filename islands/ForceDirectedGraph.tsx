/**
 * Force-Directed Graph - D3 Physics-Based Visualization
 *
 * Refactored to use modular forceDirectedEmojimap
 * Shows topics as emoji nodes with physics simulation and draggable interactions
 */

import { useEffect, useRef } from "preact/hooks";
import { useComputed, useSignal } from "@preact/signals";
import { conversationData } from "../signals/conversationStore.ts";
import {
  EmojimapHandle,
  forceDirectedEmojimap,
} from "../utils/forceDirectedEmojimap.ts";
import * as htmlToImage from "html-to-image";
import ContextMenu from "../components/ContextMenu.tsx";

interface ForceDirectedGraphProps {
  loading?: boolean;
}

export default function ForceDirectedGraph(
  { loading = false }: ForceDirectedGraphProps,
) {
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null);
  const fullscreenPortalRef = useRef<HTMLDivElement | null>(null);
  const emojimapHandleRef = useRef<EmojimapHandle | null>(null);

  // Track event listeners for cleanup
  const portalClickListenerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const escapeListenerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  const isFullscreen = useSignal(false);
  const selectedNodeId = useSignal<string | null>(null);
  const showAddNode = useSignal(false);
  const newNodeLabel = useSignal("");
  const newNodeEmoji = useSignal("");

  // Context menu state
  const contextMenuVisible = useSignal(false);
  const contextMenuX = useSignal(0);
  const contextMenuY = useSignal(0);

  // Simulation parameters
  const linkDistance = useSignal(100);
  const chargeStrength = useSignal(-850);
  const collisionRadius = useSignal(70);

  // Get topics and edges from store
  const topics = useComputed(() => conversationData.value?.nodes || []);
  const relationships = useComputed(() => conversationData.value?.edges || []);

  // ===================================================================
  // FULLSCREEN MANAGEMENT
  // ===================================================================

  function toggleFullscreen() {
    if (isFullscreen.value) {
      // Remove event listeners before removing portal
      if (fullscreenPortalRef.current && portalClickListenerRef.current) {
        fullscreenPortalRef.current.removeEventListener(
          "click",
          portalClickListenerRef.current,
        );
        portalClickListenerRef.current = null;
      }
      if (escapeListenerRef.current) {
        document.removeEventListener("keydown", escapeListenerRef.current);
        escapeListenerRef.current = null;
      }

      // Remove fullscreen
      if (fullscreenPortalRef.current?.parentNode) {
        fullscreenPortalRef.current.parentNode.removeChild(
          fullscreenPortalRef.current,
        );
      }
      fullscreenPortalRef.current = null;
      isFullscreen.value = false;

      // Reinitialize normal view
      setTimeout(() => initializeVisualization(), 50);
    } else {
      // Create fullscreen
      isFullscreen.value = true;
      createFullscreenPortal();
    }
  }

  function createFullscreenPortal() {
    // Create portal element
    const portal = document.createElement("div");
    portal.className = "fullscreen-network-viz-portal";
    portal.style.position = "fixed";
    portal.style.top = "0";
    portal.style.left = "0";
    portal.style.width = "100%";
    portal.style.height = "100%";
    portal.style.zIndex = "9999";
    portal.style.display = "flex";
    portal.style.alignItems = "center";
    portal.style.justifyContent = "center";
    portal.style.backgroundColor = "rgba(0, 0, 0, 0.9)";

    // Create modal container
    const modalContainer = document.createElement("div");
    modalContainer.className = "bg-white rounded-lg";
    modalContainer.style.width = "90%";
    modalContainer.style.height = "85%";
    modalContainer.style.padding = "1.5rem";
    modalContainer.style.border = "4px solid var(--color-accent)";
    modalContainer.style.boxShadow = "var(--shadow-xl)";

    // Create header
    const header = document.createElement("div");
    header.className = "flex justify-between items-center mb-4";

    const title = document.createElement("h2");
    title.className = "text-2xl font-bold";
    title.textContent = "Topic Network Visualization";

    const closeButton = document.createElement("button");
    closeButton.className =
      "text-2xl font-bold hover:text-gray-600 cursor-pointer";
    closeButton.innerHTML = "✕";
    closeButton.title = "Close Fullscreen";
    closeButton.onclick = toggleFullscreen;

    header.appendChild(title);
    header.appendChild(closeButton);

    // Create container for visualization
    const vizContainer = document.createElement("div");
    vizContainer.className = "bg-gray-100 rounded-lg";
    vizContainer.style.width = "100%";
    vizContainer.style.height = "calc(100% - 4rem)";
    fullscreenContainerRef.current = vizContainer;

    // Assemble
    modalContainer.appendChild(header);
    modalContainer.appendChild(vizContainer);
    portal.appendChild(modalContainer);

    // Click outside to close (store listener for cleanup)
    const clickListener = (e: MouseEvent) => {
      if (e.target === portal) toggleFullscreen();
    };
    portal.addEventListener("click", clickListener);
    portalClickListenerRef.current = clickListener;

    // Escape key to close (store listener for cleanup)
    const escListener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        toggleFullscreen();
      }
    };
    document.addEventListener("keydown", escListener);
    escapeListenerRef.current = escListener;

    document.body.appendChild(portal);
    fullscreenPortalRef.current = portal;

    // Initialize visualization in fullscreen container
    setTimeout(() => initializeVisualization(), 50);
  }

  // ===================================================================
  // VISUALIZATION MANAGEMENT
  // ===================================================================

  function initializeVisualization() {
    const container = isFullscreen.value
      ? fullscreenContainerRef.current
      : svgContainerRef.current;
    if (!container || topics.value.length === 0) return;

    // Destroy existing visualization
    if (emojimapHandleRef.current) {
      emojimapHandleRef.current.destroy();
    }

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height || Math.min(800, window.innerHeight * 0.6);

    // Map edges to correct format
    const edges = relationships.value.map((rel, index) => ({
      id: rel.id ||
        `${rel.source_topic_id}-${rel.target_topic_id}-${index}`,
      source: rel.source_topic_id,
      target: rel.target_topic_id,
      color: rel.color || "#999",
    }));

    // Initialize emojimap
    emojimapHandleRef.current = forceDirectedEmojimap(container, {
      nodes: topics.value,
      edges,
      config: {
        width,
        height,
        backgroundColor: "rgba(255,255,255,0.65)",
        linkDistance: linkDistance.value,
        chargeStrength: chargeStrength.value,
        collisionRadius: collisionRadius.value,
        linkStrokeWidth: 2,
        linkOpacity: 0.5,
        onClickNode: (_event: MouseEvent, node: { id: string }) => {
          selectedNodeId.value = node.id;
        },
        onBackgroundClick: () => {
          selectedNodeId.value = null;
        },
        onRightClickBackground: (event: MouseEvent) => {
          event.preventDefault();
          contextMenuX.value = event.clientX;
          contextMenuY.value = event.clientY;
          contextMenuVisible.value = true;
        },
      },
    });
  }

  function resetVisualization() {
    if (emojimapHandleRef.current) {
      emojimapHandleRef.current.resetVisualization();
    }
  }

  function fitToView() {
    if (emojimapHandleRef.current) {
      emojimapHandleRef.current.updateLayout();
    }
  }

  async function exportAsPng() {
    const container = isFullscreen.value
      ? fullscreenContainerRef.current
      : svgContainerRef.current;
    if (!container) return;

    try {
      // Create header overlay
      const header = document.createElement("div");
      header.style.position = "absolute";
      header.style.top = "20px";
      header.style.left = "20px";
      header.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
      header.style.padding = "8px 20px";
      header.style.borderRadius = "12px";
      header.style.fontSize = "18px";
      header.style.fontWeight = "bold";
      header.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";

      const title = conversationData.value?.conversation.title ||
        "Conversation Map";
      const timestamp = new Date().toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

      header.innerHTML =
        `<div>${title}</div><div style="font-size: 12px; font-weight: normal; color: #666;">${timestamp}</div>`;
      container.appendChild(header);

      // Hide control buttons during export
      const buttons = container.querySelectorAll("button");
      buttons.forEach((btn) => (btn.style.display = "none"));

      // Generate PNG
      const dataUrl = await htmlToImage.toPng(container, {
        backgroundColor: "#ffffff",
      });

      // Restore UI
      buttons.forEach((btn) => (btn.style.display = ""));
      container.removeChild(header);

      // Download
      const link = document.createElement("a");
      link.href = dataUrl;
      const filename = `${title.replace(/\s+/g, "_")}_${
        timestamp.replace(/[\s,:]+/g, "_")
      }.png`;
      link.download = filename;
      link.click();
    } catch (error) {
      console.error("Error exporting as PNG:", error);
      alert("Failed to export PNG. Please try again.");
    }
  }

  function addManualNode() {
    const label = newNodeLabel.value.trim();
    if (!label || !conversationData.value) return;

    const emoji = newNodeEmoji.value.trim() || "✨";
    const id = `manual_${crypto.randomUUID()}`;
    const nextNode = {
      id,
      label,
      emoji,
      color: "#E8839C",
    };

    conversationData.value = {
      ...conversationData.value,
      nodes: [...conversationData.value.nodes, nextNode],
    };
    selectedNodeId.value = id;
    newNodeLabel.value = "";
    newNodeEmoji.value = "";
    showAddNode.value = false;
  }

  // ===================================================================
  // LIFECYCLE
  // ===================================================================

  // Initialize on mount
  useEffect(() => {
    if (topics.value.length > 0 && svgContainerRef.current) {
      initializeVisualization();
    }

    return () => {
      // Cleanup
      if (emojimapHandleRef.current) {
        emojimapHandleRef.current.destroy();
      }
      // Cleanup fullscreen portal
      if (fullscreenPortalRef.current?.parentNode) {
        fullscreenPortalRef.current.parentNode.removeChild(
          fullscreenPortalRef.current,
        );
      }
    };
  }, []);

  // Update when data or params change
  useEffect(() => {
    if (topics.value.length > 0 && emojimapHandleRef.current) {
      const edges = relationships.value.map((rel, index) => ({
        id: rel.id ||
          `${rel.source_topic_id}-${rel.target_topic_id}-${index}`,
        source: rel.source_topic_id,
        target: rel.target_topic_id,
        color: rel.color || "#999",
      }));

      emojimapHandleRef.current.update({
        nodes: topics.value,
        edges,
        config: {
          linkDistance: linkDistance.value,
          chargeStrength: chargeStrength.value,
          collisionRadius: collisionRadius.value,
        },
      });
    }
  }, [
    topics.value,
    relationships.value,
    linkDistance.value,
    chargeStrength.value,
    collisionRadius.value,
  ]);

  // ===================================================================
  // RENDER
  // ===================================================================

  if (loading) {
    return (
      <div class="flex h-full items-center justify-center">
        <div class="loading loading-spinner text-primary"></div>
      </div>
    );
  }

  if (topics.value.length === 0) {
    return (
      <div class="empty-state" style="min-height: 400px;">
        <div class="empty-state-icon">🕸️</div>
        <div class="empty-state-text">No topics yet</div>
      </div>
    );
  }

  // Context menu items
  const contextMenuItems = [
    {
      label: "Reset Positions",
      icon: "🔄",
      onClick: resetVisualization,
    },
    {
      label: "Fit to View",
      icon: "📐",
      onClick: fitToView,
    },
    {
      label: "Export as PNG",
      icon: "📸",
      onClick: exportAsPng,
    },
  ];

  const selectedNode = selectedNodeId.value
    ? topics.value.find((node) => node.id === selectedNodeId.value)
    : null;
  const connectedEdges = selectedNode
    ? relationships.value.filter((edge) =>
      edge.source_topic_id === selectedNode.id ||
      edge.target_topic_id === selectedNode.id
    )
    : [];
  const connectedTopics = selectedNode
    ? connectedEdges
      .map((edge) =>
        edge.source_topic_id === selectedNode.id
          ? edge.target_topic_id
          : edge.source_topic_id
      )
      .map((id) => topics.value.find((node) => node.id === id))
      .filter(Boolean)
    : [];

  return (
    <div class="relative flex h-full w-full flex-col">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div class="topic-map-stats" aria-label="Topic map stats">
          <span>{topics.value.length} topics</span>
          <span>{relationships.value.length} links</span>
        </div>
        <button
          type="button"
          class="topic-map-add-button"
          onClick={() => showAddNode.value = true}
        >
          <span aria-hidden="true">＋</span>
          <span>Add topic</span>
        </button>
      </div>

      <div
        ref={svgContainerRef}
        class="topic-map-canvas mx-auto w-full flex-1 overflow-hidden rounded-lg border border-gray-300 bg-gray-100"
        style="min-height: 400px; height: 100%;"
      />

      {selectedNode && (
        <aside class="topic-node-detail" aria-live="polite">
          <button
            type="button"
            class="topic-node-detail__close"
            onClick={() => selectedNodeId.value = null}
            aria-label="Close topic details"
          >
            ×
          </button>
          <div class="topic-node-detail__emoji">
            {selectedNode.emoji || "✨"}
          </div>
          <div>
            <h4>{selectedNode.label}</h4>
            <p>
              {connectedEdges.length === 0
                ? "Standalone topic. It can still be useful as a marker."
                : `${connectedEdges.length} connection${
                  connectedEdges.length === 1 ? "" : "s"
                } in this conversation.`}
            </p>
          </div>
          {connectedTopics.length > 0 && (
            <div class="topic-node-detail__links">
              {connectedTopics.map((topic: any) => (
                <button
                  type="button"
                  key={topic.id}
                  onClick={() => selectedNodeId.value = topic.id}
                >
                  <span>{topic.emoji || "•"}</span>
                  <span>{topic.label}</span>
                </button>
              ))}
            </div>
          )}
        </aside>
      )}

      {showAddNode.value && (
        <div class="topic-node-modal-backdrop">
          <div class="topic-node-modal" role="dialog" aria-modal="true">
            <div class="topic-node-modal__header">
              <h4>Add topic</h4>
              <button
                type="button"
                onClick={() => showAddNode.value = false}
                aria-label="Close add topic"
              >
                ×
              </button>
            </div>
            <label>
              <span>Emoji</span>
              <input
                value={newNodeEmoji.value}
                onInput={(event) =>
                  newNodeEmoji.value = (event.target as HTMLInputElement).value}
                placeholder="✨"
                maxLength={4}
              />
            </label>
            <label>
              <span>Topic</span>
              <input
                value={newNodeLabel.value}
                onInput={(event) =>
                  newNodeLabel.value = (event.target as HTMLInputElement).value}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addManualNode();
                }}
                placeholder="New thread"
                autoFocus
              />
            </label>
            <div class="topic-node-modal__actions">
              <button
                type="button"
                onClick={() => showAddNode.value = false}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addManualNode}
                disabled={!newNodeLabel.value.trim()}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Control buttons */}
      <div class="absolute bottom-4 right-4 flex gap-2">
        {/* PNG Export button */}
        <button
          class="bg-white bg-opacity-70 hover:bg-opacity-100 shadow-lg rounded-full w-10 h-10 flex items-center justify-center text-lg cursor-pointer"
          onClick={exportAsPng}
          title="Export as PNG"
        >
          📸
        </button>

        {/* Reset button */}
        <button
          class="bg-white bg-opacity-70 hover:bg-opacity-100 shadow-lg rounded-full w-10 h-10 flex items-center justify-center text-lg cursor-pointer"
          onClick={resetVisualization}
          title="Reset node positions"
        >
          🔄
        </button>

        {/* Fit to view button */}
        <button
          class="bg-white bg-opacity-70 hover:bg-opacity-100 shadow-lg rounded-full w-10 h-10 flex items-center justify-center text-lg cursor-pointer"
          onClick={fitToView}
          title="Fit all nodes to view"
        >
          📐
        </button>

        {/* Fullscreen button */}
        <button
          class="bg-white bg-opacity-70 hover:bg-opacity-100 shadow-lg rounded-full w-10 h-10 flex items-center justify-center text-lg cursor-pointer"
          onClick={toggleFullscreen}
          title="Toggle fullscreen view"
        >
          ⛶
        </button>
      </div>

      {/* Context menu */}
      <ContextMenu
        visible={contextMenuVisible.value}
        x={contextMenuX.value}
        y={contextMenuY.value}
        items={contextMenuItems}
        onClose={() => contextMenuVisible.value = false}
      />
    </div>
  );
}
