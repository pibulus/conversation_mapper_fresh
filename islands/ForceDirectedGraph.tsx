/**
 * Force-Directed Graph - D3 Physics-Based Visualization
 *
 * Refactored to use modular forceDirectedEmojimap
 * Shows topics as emoji nodes with physics simulation and draggable interactions
 */

import { useEffect, useRef } from "preact/hooks";
import { useSignal, useComputed } from "@preact/signals";
import { conversationData } from "../signals/conversationStore.ts";
import { forceDirectedEmojimap, EmojimapHandle } from "../utils/forceDirectedEmojimap.ts";
import * as htmlToImage from "html-to-image";
import ContextMenu from "../components/ContextMenu.tsx";

interface ForceDirectedGraphProps {
  loading?: boolean;
}

export default function ForceDirectedGraph({ loading = false }: ForceDirectedGraphProps) {
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null);
  const fullscreenPortalRef = useRef<HTMLDivElement | null>(null);
  const emojimapHandleRef = useRef<EmojimapHandle | null>(null);

  const isFullscreen = useSignal(false);

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
      // Remove fullscreen
      if (fullscreenPortalRef.current?.parentNode) {
        fullscreenPortalRef.current.parentNode.removeChild(fullscreenPortalRef.current);
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
    const portal = document.createElement('div');
    portal.className = 'fullscreen-network-viz-portal';
    portal.style.position = 'fixed';
    portal.style.top = '0';
    portal.style.left = '0';
    portal.style.width = '100%';
    portal.style.height = '100%';
    portal.style.zIndex = '9999';
    portal.style.display = 'flex';
    portal.style.alignItems = 'center';
    portal.style.justifyContent = 'center';
    portal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';

    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'bg-white rounded-lg shadow-brutal border-4 border-purple-400';
    modalContainer.style.width = '90%';
    modalContainer.style.height = '85%';
    modalContainer.style.padding = '1.5rem';

    // Create header
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-4';

    const title = document.createElement('h2');
    title.className = 'text-2xl font-bold';
    title.textContent = 'Topic Network Visualization';

    const closeButton = document.createElement('button');
    closeButton.className = 'text-2xl font-bold hover:text-gray-600 cursor-pointer';
    closeButton.innerHTML = '✕';
    closeButton.title = 'Close Fullscreen';
    closeButton.onclick = toggleFullscreen;

    header.appendChild(title);
    header.appendChild(closeButton);

    // Create container for visualization
    const vizContainer = document.createElement('div');
    vizContainer.className = 'bg-gray-100 rounded-lg';
    vizContainer.style.width = '100%';
    vizContainer.style.height = 'calc(100% - 4rem)';
    fullscreenContainerRef.current = vizContainer;

    // Assemble
    modalContainer.appendChild(header);
    modalContainer.appendChild(vizContainer);
    portal.appendChild(modalContainer);

    // Click outside to close
    portal.addEventListener('click', (e) => {
      if (e.target === portal) toggleFullscreen();
    });

    // Escape key to close
    const escListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleFullscreen();
        document.removeEventListener('keydown', escListener);
      }
    };
    document.addEventListener('keydown', escListener);

    document.body.appendChild(portal);
    fullscreenPortalRef.current = portal;

    // Initialize visualization in fullscreen container
    setTimeout(() => initializeVisualization(), 50);
  }

  // ===================================================================
  // VISUALIZATION MANAGEMENT
  // ===================================================================

  function initializeVisualization() {
    const container = isFullscreen.value ? fullscreenContainerRef.current : svgContainerRef.current;
    if (!container || topics.value.length === 0) return;

    // Destroy existing visualization
    if (emojimapHandleRef.current) {
      emojimapHandleRef.current.destroy();
    }

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = isFullscreen.value ? rect.height : 800;

    // Map edges to correct format
    const edges = relationships.value.map(rel => ({
      id: rel.id,
      source: rel.source_topic_id,
      target: rel.target_topic_id,
      color: rel.color || '#999'
    }));

    // Initialize emojimap
    emojimapHandleRef.current = forceDirectedEmojimap(container, {
      nodes: topics.value,
      edges,
      config: {
        width,
        height,
        backgroundColor: 'rgba(255,255,255,0.65)',
        linkDistance: linkDistance.value,
        chargeStrength: chargeStrength.value,
        collisionRadius: collisionRadius.value,
        linkStrokeWidth: 2,
        linkOpacity: 0.5,
        onRightClickBackground: (event: MouseEvent) => {
          event.preventDefault();
          contextMenuX.value = event.clientX;
          contextMenuY.value = event.clientY;
          contextMenuVisible.value = true;
        }
      }
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
    const container = isFullscreen.value ? fullscreenContainerRef.current : svgContainerRef.current;
    if (!container) return;

    try {
      // Create header overlay
      const header = document.createElement('div');
      header.style.position = 'absolute';
      header.style.top = '20px';
      header.style.left = '20px';
      header.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
      header.style.padding = '8px 20px';
      header.style.borderRadius = '12px';
      header.style.fontSize = '18px';
      header.style.fontWeight = 'bold';
      header.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';

      const title = conversationData.value?.title || 'Conversation Map';
      const timestamp = new Date().toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });

      header.innerHTML = `<div>${title}</div><div style="font-size: 12px; font-weight: normal; color: #666;">${timestamp}</div>`;
      container.appendChild(header);

      // Hide control buttons during export
      const buttons = container.querySelectorAll('button');
      buttons.forEach((btn) => (btn.style.display = 'none'));

      // Generate PNG
      const dataUrl = await htmlToImage.toPng(container, {
        backgroundColor: '#ffffff'
      });

      // Restore UI
      buttons.forEach((btn) => (btn.style.display = ''));
      container.removeChild(header);

      // Download
      const link = document.createElement('a');
      link.href = dataUrl;
      const filename = `${title.replace(/\s+/g, '_')}_${timestamp.replace(/[\s,:]+/g, '_')}.png`;
      link.download = filename;
      link.click();
    } catch (error) {
      console.error('Error exporting as PNG:', error);
      alert('Failed to export PNG. Please try again.');
    }
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
        fullscreenPortalRef.current.parentNode.removeChild(fullscreenPortalRef.current);
      }
    };
  }, []);

  // Update when data or params change
  useEffect(() => {
    if (topics.value.length > 0 && emojimapHandleRef.current) {
      const edges = relationships.value.map(rel => ({
        id: rel.id,
        source: rel.source_topic_id,
        target: rel.target_topic_id,
        color: rel.color || '#999'
      }));

      emojimapHandleRef.current.update({
        nodes: topics.value,
        edges,
        config: {
          linkDistance: linkDistance.value,
          chargeStrength: chargeStrength.value,
          collisionRadius: collisionRadius.value
        }
      });
    }
  }, [topics.value, relationships.value, linkDistance.value, chargeStrength.value, collisionRadius.value]);

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
      <div class="flex h-full items-center justify-center text-gray-500">
        <p>No topic data available</p>
      </div>
    );
  }

  // Context menu items
  const contextMenuItems = [
    {
      label: 'Reset Positions',
      icon: '🔄',
      onClick: resetVisualization
    },
    {
      label: 'Fit to View',
      icon: '📐',
      onClick: fitToView
    },
    {
      label: 'Export as PNG',
      icon: '📸',
      onClick: exportAsPng
    }
  ];

  return (
    <div class="relative flex h-full w-full flex-col">
      <div
        ref={svgContainerRef}
        class="mx-auto w-full flex-1 overflow-hidden rounded-lg border border-gray-300 bg-gray-100"
        style="height: 800px;"
      />

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
