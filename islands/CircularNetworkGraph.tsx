/**
 * Circular Network Graph - D3 Visualization
 *
 * Adapted from SvelteKit CircularNetworkGraphVisualization.svelte
 * Shows topics in circular layout with curved arc connections
 */

import { useEffect, useRef } from "preact/hooks";
import { useSignal, useComputed } from "@preact/signals";
import * as d3 from "d3";
import { conversationData } from "../signals/conversationStore.ts";

interface CircularNetworkGraphProps {
  loading?: boolean;
}

export default function CircularNetworkGraph({ loading = false }: CircularNetworkGraphProps) {
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null);
  const fullscreenPortalRef = useRef<HTMLDivElement | null>(null);

  // Track event listeners for cleanup
  const portalClickListenerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const escapeListenerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  const isFullscreen = useSignal(false);
  const width = useSignal(0);
  const height = useSignal(0);

  // Get topics and edges from store
  const topics = useComputed(() => conversationData.value?.nodes || []);
  const relationships = useComputed(() => conversationData.value?.edges || []);

  // Toggle fullscreen
  function toggleFullscreen() {
    if (isFullscreen.value) {
      // Remove event listeners before removing portal
      if (fullscreenPortalRef.current && portalClickListenerRef.current) {
        fullscreenPortalRef.current.removeEventListener('click', portalClickListenerRef.current);
        portalClickListenerRef.current = null;
      }
      if (escapeListenerRef.current) {
        document.removeEventListener('keydown', escapeListenerRef.current);
        escapeListenerRef.current = null;
      }

      // Remove fullscreen
      if (fullscreenPortalRef.current?.parentNode) {
        fullscreenPortalRef.current.parentNode.removeChild(fullscreenPortalRef.current);
      }
      fullscreenPortalRef.current = null;
      isFullscreen.value = false;

      // Force update normal view
      setTimeout(updateDimensions, 50);
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
    modalContainer.className = 'bg-white rounded-lg';
    modalContainer.style.width = '90%';
    modalContainer.style.height = '85%';
    modalContainer.style.padding = '1.5rem';
    modalContainer.style.border = '4px solid var(--color-accent)';
    modalContainer.style.boxShadow = 'var(--shadow-xl)';

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

    // Click outside to close (store listener for cleanup)
    const clickListener = (e: MouseEvent) => {
      if (e.target === portal) toggleFullscreen();
    };
    portal.addEventListener('click', clickListener);
    portalClickListenerRef.current = clickListener;

    // Escape key to close (store listener for cleanup)
    const escListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleFullscreen();
      }
    };
    document.addEventListener('keydown', escListener);
    escapeListenerRef.current = escListener;

    document.body.appendChild(portal);
    fullscreenPortalRef.current = portal;

    setTimeout(updateDimensions, 50);
  }

  function updateDimensions() {
    const container = isFullscreen.value ? fullscreenContainerRef.current : svgContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    width.value = rect.width;
    height.value = isFullscreen.value ? rect.height : rect.width; // Square in normal mode

    updateVisualization(container);
  }

  function updateVisualization(container: HTMLElement) {
    if (!container || !width.value || !height.value || topics.value.length === 0) return;

    // Get CSS color values
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim();
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim();
    const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim();

    // Remove existing SVG
    d3.select(container).select('svg').remove();

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width.value)
      .attr('height', height.value)
      .attr('viewBox', `0 0 ${width.value} ${height.value}`);

    const centerX = width.value / 2;
    const centerY = height.value / 2;
    const radius = Math.min(centerX, centerY) - 100;

    // Scale based on fullscreen
    const sizeMultiplier = isFullscreen.value ? 1.8 : 1;
    const baseNodeRadius = 8 * sizeMultiplier;
    const baseFontSize = 10 * sizeMultiplier;

    // Position topics in circle
    const positionedTopics = topics.value.map((topic, i) => {
      const angle = (i / topics.value.length) * 2 * Math.PI;
      return {
        ...topic,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });

    // Create links group
    const linkGroup = svg.append('g').attr('class', 'links');

    // Draw curved arc links
    relationships.value.forEach((rel) => {
      const source = positionedTopics.find(t => t.id === rel.source_topic_id);
      const target = positionedTopics.find(t => t.id === rel.target_topic_id);

      if (source && target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;

        linkGroup.append('path')
          .attr('d', `M ${source.x} ${source.y} A ${dr} ${dr} 0 0 1 ${target.x} ${target.y}`)
          .attr('stroke', rel.color || '#999')
          .attr('stroke-width', 1.5 * sizeMultiplier)
          .attr('fill', 'none')
          .attr('opacity', 0.6);
      }
    });

    // Create nodes group
    const nodeGroup = svg.append('g').attr('class', 'nodes');

    // Create tooltip
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'absolute bg-white text-sm shadow-lg rounded px-2 py-1 border border-gray-300')
      .style('position', 'absolute')
      .style('opacity', 0)
      .style('pointer-events', 'none')
      .style('z-index', 10000);

    // Draw nodes
    nodeGroup.selectAll('circle')
      .data(positionedTopics)
      .enter()
      .append('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', baseNodeRadius)
      .attr('fill', d => d.color || accentColor)
      .attr('stroke', textColor)
      .attr('stroke-width', 1.5 * sizeMultiplier)
      .attr('class', 'cursor-pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', baseNodeRadius * 1.5);

        // Highlight connected nodes
        const connectedIds = relationships.value
          .filter(rel => rel.source_topic_id === d.id || rel.target_topic_id === d.id)
          .flatMap(rel => [rel.source_topic_id, rel.target_topic_id]);

        nodeGroup.selectAll('circle')
          .filter((node: any) => connectedIds.includes(node.id))
          .attr('stroke-width', 3 * sizeMultiplier)
          .attr('stroke', accentColor);

        tooltip.style('opacity', 1)
          .html(`<div class="p-2"><strong>${d.emoji} ${d.label}</strong></div>`)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 20 + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', baseNodeRadius);
        nodeGroup.selectAll('circle').attr('stroke-width', 1.5 * sizeMultiplier);
        tooltip.style('opacity', 0);
      });

    // Add labels
    nodeGroup.selectAll('text')
      .data(positionedTopics)
      .enter()
      .append('text')
      .attr('x', d => d.x)
      .attr('y', d => d.y + 25 * sizeMultiplier)
      .attr('text-anchor', 'middle')
      .text(d => {
        const maxLength = isFullscreen.value ? 40 : 15;
        return d.label.length > maxLength ? d.label.substring(0, maxLength) + '...' : d.label;
      })
      .attr('font-size', `${baseFontSize}px`)
      .attr('fill', textSecondary)
      .attr('opacity', 0.9);

    // Add zoom in fullscreen
    if (isFullscreen.value) {
      const zoom = d3.zoom()
        .scaleExtent([0.5, 5])
        .on('zoom', (event) => {
          svg.selectAll('g').attr('transform', event.transform);
        });

      svg.call(zoom as any);

      svg.append('text')
        .attr('x', 20)
        .attr('y', height.value - 20)
        .attr('text-anchor', 'start')
        .attr('class', 'text-xs opacity-50')
        .text('Scroll to zoom, drag to pan');
    }
  }

  // Handle resize
  useEffect(() => {
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (svgContainerRef.current) {
      resizeObserver.observe(svgContainerRef.current);
    }

    updateDimensions();

    return () => {
      resizeObserver.disconnect();

      // Cleanup tooltip (more specific selector to avoid removing unrelated elements)
      d3.selectAll('body > div.absolute').filter(function() {
        const text = d3.select(this).text();
        return text && text.trim().length > 0; // Only remove tooltips with content
      }).remove();

      // Cleanup event listeners
      if (fullscreenPortalRef.current && portalClickListenerRef.current) {
        fullscreenPortalRef.current.removeEventListener('click', portalClickListenerRef.current);
      }
      if (escapeListenerRef.current) {
        document.removeEventListener('keydown', escapeListenerRef.current);
      }

      // Cleanup fullscreen portal
      if (fullscreenPortalRef.current?.parentNode) {
        fullscreenPortalRef.current.parentNode.removeChild(fullscreenPortalRef.current);
      }
    };
  }, []);

  // Re-render when data changes
  useEffect(() => {
    if (topics.value.length > 0) {
      updateDimensions();
    }
  }, [topics.value, relationships.value, isFullscreen.value]);

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

  return (
    <div class="relative flex h-full w-full flex-col">
      <div
        ref={svgContainerRef}
        class="mx-auto aspect-square w-full flex-1 overflow-hidden rounded-lg border border-gray-300 bg-gray-100"
      />

      {/* Fullscreen button */}
      <button
        class="absolute bottom-4 right-4 bg-white bg-opacity-70 hover:bg-opacity-100 shadow-lg rounded-full w-10 h-10 flex items-center justify-center text-lg cursor-pointer"
        onClick={toggleFullscreen}
        title="Toggle fullscreen view"
        aria-label="Toggle fullscreen visualization"
      >
        ⛶
      </button>
    </div>
  );
}
