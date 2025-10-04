/**
 * Force-Directed Graph - D3 Physics-Based Visualization
 *
 * Ported from SvelteKit EmojiGraphVisualization.svelte
 * Shows topics as emoji nodes with physics simulation and draggable interactions
 */

import { useEffect, useRef } from "preact/hooks";
import { useSignal, useComputed } from "@preact/signals";
import * as d3 from "d3";
import { conversationData } from "../signals/conversationStore.ts";

interface ForceDirectedGraphProps {
  loading?: boolean;
}

interface NodeData {
  id: string;
  label: string;
  emoji: string;
  color: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
}

interface LinkData {
  source: NodeData | string;
  target: NodeData | string;
  color?: string;
}

export default function ForceDirectedGraph({ loading = false }: ForceDirectedGraphProps) {
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null);
  const fullscreenPortalRef = useRef<HTMLDivElement | null>(null);

  const isFullscreen = useSignal(false);
  const width = useSignal(0);
  const height = useSignal(800);

  // Simulation parameters
  const linkDistance = useSignal(100);
  const chargeStrength = useSignal(-850);
  const collisionRadius = useSignal(70);

  // D3 references
  const simulationRef = useRef<d3.Simulation<NodeData, LinkData> | null>(null);

  // Get topics and edges from store
  const topics = useComputed(() => conversationData.value?.nodes || []);
  const relationships = useComputed(() => conversationData.value?.edges || []);

  // Toggle fullscreen
  function toggleFullscreen() {
    if (isFullscreen.value) {
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
        portal.removeEventListener('keydown', escListener);
      }
    };
    portal.tabIndex = 0;
    portal.addEventListener('keydown', escListener);

    document.body.appendChild(portal);
    fullscreenPortalRef.current = portal;

    setTimeout(updateDimensions, 50);
  }

  function updateDimensions() {
    const container = isFullscreen.value ? fullscreenContainerRef.current : svgContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    width.value = rect.width;
    height.value = isFullscreen.value ? rect.height : 800;

    updateVisualization(container);
  }

  function updateVisualization(container: HTMLElement) {
    if (!container || !width.value || !height.value || topics.value.length === 0) return;

    // Stop existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Remove existing SVG
    d3.select(container).select('svg').remove();

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width.value)
      .attr('height', height.value)
      .attr('viewBox', `0 0 ${width.value} ${height.value}`)
      .style('background-color', 'rgba(255,255,255,0.65)')
      .style('border-radius', '1rem')
      .style('cursor', 'grab');

    const centerX = width.value / 2;
    const centerY = height.value / 2;

    // Scale based on fullscreen
    const sizeMultiplier = isFullscreen.value ? 1.8 : 1;

    // Clone node data to avoid mutating store
    const nodeData: NodeData[] = topics.value.map(t => ({ ...t }));

    // Build links with actual node objects
    const nodeMap = new Map(nodeData.map(n => [n.id, n]));
    const linkData: LinkData[] = relationships.value.map(rel => ({
      source: nodeMap.get(rel.source_topic_id)!,
      target: nodeMap.get(rel.target_topic_id)!,
      color: rel.color || '#999'
    })).filter(link => link.source && link.target);

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      })
      .on('start', () => svg.style('cursor', 'grabbing'))
      .on('end', () => svg.style('cursor', 'grab'));

    const g = svg.append('g');
    svg.call(zoom);

    // Create links group
    const linkGroup = g.append('g').attr('class', 'links');

    // Create nodes group
    const nodeGroup = g.append('g').attr('class', 'nodes');

    // Create tooltip
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'force-graph-tooltip')
      .style('position', 'absolute')
      .style('opacity', 0)
      .style('pointer-events', 'none')
      .style('background', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('border', '1px solid #ccc')
      .style('box-shadow', '0 2px 8px rgba(0,0,0,0.15)')
      .style('z-index', 10000)
      .style('font-size', '14px');

    // Draw links
    const link = linkGroup.selectAll('line')
      .data(linkData)
      .enter()
      .append('line')
      .attr('stroke', d => d.color || '#999')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.5);

    // Create node groups
    const node = nodeGroup.selectAll('g')
      .data(nodeData)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .style('cursor', 'grab');

    // Add emoji text to nodes
    node.append('text')
      .attr('class', 'emoji')
      .text(d => d.emoji)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', `${28 * sizeMultiplier}px`)
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .style('user-select', 'none')
      .style('pointer-events', 'none');

    // Add label text below emoji
    node.append('text')
      .attr('class', 'label')
      .text(d => d.label.length > 20 ? d.label.substring(0, 20) + '...' : d.label)
      .attr('text-anchor', 'middle')
      .attr('y', 25 * sizeMultiplier)
      .attr('font-size', `${14 * sizeMultiplier}px`)
      .attr('fill', '#2d3748')
      .style('user-select', 'none')
      .style('pointer-events', 'none');

    // Drag behavior
    function dragstarted(event: any, d: NodeData) {
      if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
      d3.select(event.sourceEvent.target.parentNode).style('cursor', 'grabbing');
    }

    function dragged(event: any, d: NodeData) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: NodeData) {
      if (!event.active) simulationRef.current?.alphaTarget(0);
      d.fx = null;
      d.fy = null;
      d3.select(event.sourceEvent.target.parentNode).style('cursor', 'grab');
    }

    const drag = d3.drag<SVGGElement, NodeData>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);

    node.call(drag);

    // Hover effects
    node.on('mouseenter', function(event, d) {
      // Enlarge emoji
      d3.select(this).select('.emoji')
        .transition()
        .duration(200)
        .attr('font-size', `${38 * sizeMultiplier}px`);

      // Bold label
      d3.select(this).select('.label')
        .transition()
        .duration(200)
        .attr('font-size', `${16 * sizeMultiplier}px`)
        .attr('font-weight', 'bold');

      // Highlight connected links
      link
        .filter((l: any) => {
          const source = typeof l.source === 'object' ? l.source.id : l.source;
          const target = typeof l.target === 'object' ? l.target.id : l.target;
          return source === d.id || target === d.id;
        })
        .transition()
        .duration(200)
        .attr('stroke-width', 4)
        .attr('stroke-opacity', 1);

      // Show tooltip
      tooltip.style('opacity', 1)
        .html(`<strong>${d.emoji} ${d.label}</strong>`)
        .style('left', event.pageX + 10 + 'px')
        .style('top', event.pageY - 20 + 'px');
    })
    .on('mouseleave', function() {
      // Reset emoji size
      d3.select(this).select('.emoji')
        .transition()
        .duration(200)
        .attr('font-size', `${28 * sizeMultiplier}px`);

      // Reset label
      d3.select(this).select('.label')
        .transition()
        .duration(200)
        .attr('font-size', `${14 * sizeMultiplier}px`)
        .attr('font-weight', 'normal');

      // Reset links
      link.transition()
        .duration(200)
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.5);

      // Hide tooltip
      tooltip.style('opacity', 0);
    });

    // Create force simulation
    const simulation = d3.forceSimulation(nodeData)
      .force('link', d3.forceLink<NodeData, LinkData>(linkData)
        .id(d => d.id)
        .distance(linkDistance.value))
      .force('charge', d3.forceManyBody().strength(chargeStrength.value))
      .force('x', d3.forceX(centerX).strength(0.05))
      .force('y', d3.forceY(centerY).strength(0.05))
      .force('collide', d3.forceCollide(collisionRadius.value));

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    simulationRef.current = simulation;

    // Add hint text in fullscreen
    if (isFullscreen.value) {
      svg.append('text')
        .attr('x', 20)
        .attr('y', height.value - 20)
        .attr('text-anchor', 'start')
        .attr('class', 'text-xs')
        .attr('opacity', 0.5)
        .text('Scroll to zoom, drag to pan, drag nodes to move');
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
      // Stop simulation
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      // Cleanup tooltip
      d3.selectAll('.force-graph-tooltip').remove();
      // Cleanup fullscreen portal
      if (fullscreenPortalRef.current?.parentNode) {
        fullscreenPortalRef.current.parentNode.removeChild(fullscreenPortalRef.current);
      }
    };
  }, []);

  // Re-render when data or params change
  useEffect(() => {
    if (topics.value.length > 0) {
      updateDimensions();
    }
  }, [topics.value, relationships.value, isFullscreen.value, linkDistance.value, chargeStrength.value, collisionRadius.value]);

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
        class="mx-auto w-full flex-1 overflow-hidden rounded-lg border border-gray-300 bg-gray-100"
        style="height: 800px;"
      />

      {/* Fullscreen button */}
      <button
        class="absolute bottom-4 right-4 bg-white bg-opacity-70 hover:bg-opacity-100 shadow-lg rounded-full w-10 h-10 flex items-center justify-center text-lg cursor-pointer"
        onClick={toggleFullscreen}
        title="Toggle fullscreen view"
      >
        ⛶
      </button>
    </div>
  );
}
