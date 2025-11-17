/**
 * Force-Directed Emojimap Visualization
 *
 * D3-based force simulation for topic graphs with emoji nodes
 * Ported from Svelte conversation_mapper implementation
 */

import { select, selectAll } from "d3-selection";
import { zoom as d3Zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import { drag as d3Drag } from "d3-drag";
import { forceSimulation, forceLink, forceManyBody, forceX, forceY, forceCollide, type Simulation, type ForceLink } from "d3-force";
import { min as d3Min, max as d3Max } from "d3-array";

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait) as unknown as number;
  };
}

// ===================================================================
// TYPE DEFINITIONS
// ===================================================================

interface NodeData {
  id: string;
  label: string;
  emoji?: string;
  color?: string;
  meta?: { emoji?: string };
  metadata?: { emoji?: string };
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
}

interface EdgeData {
  id?: string;
  source: string | NodeData;
  target: string | NodeData;
  sourceTopicId?: string;
  targetTopicId?: string;
  source_topic_id?: string;
  target_topic_id?: string;
  color?: string;
}

interface Config {
  width: number;
  height: number;
  backgroundColor: string;
  linkColor: string;
  linkStrokeWidth: number;
  linkOpacity: number;
  nodeColor: string;
  emojiFontSize: string;
  labelFontSize: string;
  labelColor: string;
  linkDistance: number;
  chargeStrength: number;
  collisionRadius: number;
  onMouseOverNode?: (event: any, d: NodeData) => void;
  onDoubleClickNode?: (event: any, d: NodeData) => void;
  onRightClickNode?: (event: any, d: NodeData) => void;
  onMouseOverEdge?: (event: any, d: EdgeData) => void;
  onDoubleClickEdge?: (event: any, d: EdgeData) => void;
  onRightClickEdge?: (event: any, d: EdgeData) => void;
  onBackgroundClick?: (event: any) => void;
  onRightClickBackground?: (event: any) => void;
}

// ===================================================================
// DEFAULT CONFIGURATION
// ===================================================================

const defaultConfig: Config = {
  width: 600,
  height: 400,
  backgroundColor: 'rgba(255,255,255,0.65)',
  linkColor: 'rgba(0,0,0,0.3)',
  linkStrokeWidth: 3,
  linkOpacity: 1,
  nodeColor: 'oklch(0.75 0.1 40)', // Warm accent color
  emojiFontSize: '28px',
  labelFontSize: '14px',
  labelColor: 'oklch(0.35 0.03 30)', // Soft black
  linkDistance: 100,
  chargeStrength: -1500,
  collisionRadius: 50,
  onMouseOverNode: () => {},
  onDoubleClickNode: () => {},
  onRightClickNode: () => {},
  onMouseOverEdge: () => {},
  onDoubleClickEdge: () => {},
  onRightClickEdge: () => {},
  onBackgroundClick: () => {},
  onRightClickBackground: (event) => {
    event.preventDefault();
    // Dispatch custom event for external handling
    document.dispatchEvent(
      new CustomEvent('show-background-context-menu', {
        detail: { clientX: event.clientX, clientY: event.clientY }
      })
    );
  }
};

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

/**
 * Creates an SVG element with proper viewBox and styling
 */
function createSvg(node: HTMLElement, config: Config) {
  const svg = d3
    .select(node)
    .append('svg')
    .attr('width', config.width)
    .attr('height', config.height)
    .attr('viewBox', `0 0 ${config.width} ${config.height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('background-color', config.backgroundColor)
    .on('click', (event) => {
      if (event.target === svg.node() && config.onBackgroundClick) {
        config.onBackgroundClick(event);
      }
    })
    .on('contextmenu', (event) => {
      event.preventDefault();
      if (config.onRightClickBackground) {
        config.onRightClickBackground(event);
      }
    });
  return svg;
}

/**
 * Attaches zoom behavior to SVG
 */
function createZoomBehavior(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  g: d3.Selection<SVGGElement, unknown, null, undefined>
) {
  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 10])
    .on('zoom', (event) => {
      g.attr('transform', event.transform.toString());
    });
  svg.call(zoom);
  return zoom;
}

/**
 * Creates separate groups for links and nodes
 */
function createGroups(g: d3.Selection<SVGGElement, unknown, null, undefined>) {
  const linkGroup = g.append('g').attr('class', 'links');
  const nodeGroup = g.append('g').attr('class', 'nodes');
  return { linkGroup, nodeGroup };
}

/**
 * Maps raw edge data into objects suitable for D3 force simulation
 */
function mapEdges(edges: EdgeData[] = []): EdgeData[] {
  if (!edges || !Array.isArray(edges)) return [];

  return edges.map((edge, i) => {
    if (!edge) return null;

    const sourceId = edge.sourceTopicId || edge.source_topic_id || (typeof edge.source === 'string' ? edge.source : '');
    const targetId = edge.targetTopicId || edge.target_topic_id || (typeof edge.target === 'string' ? edge.target : '');

    if (!sourceId || !targetId) return null;

    return {
      ...edge,
      source: sourceId,
      target: targetId,
      id: edge.id || `${sourceId}-${targetId}-${i}`
    };
  }).filter((edge): edge is EdgeData => edge !== null);
}

/**
 * Drag event handlers
 */
function dragstarted(event: any, d: NodeData, simulation: Simulation<NodeData, undefined>) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(event: any, d: NodeData) {
  d.fx = event.x;
  d.fy = event.y;
}

function dragended(event: any, d: NodeData, simulation: Simulation<NodeData, undefined>) {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

/**
 * Creates and configures a node group with drag behavior, emoji, and label
 */
function createNodeGroup(
  selection: d3.Selection<SVGGElement, NodeData, SVGGElement, unknown>,
  config: Config,
  simulation: Simulation<NodeData, undefined>
) {
  selection
    .attr('class', 'node-group')
    .style('cursor', 'grab')
    .call(
      d3
        .drag<SVGGElement, NodeData>()
        .on('start', (event, d) => dragstarted(event, d, simulation))
        .on('drag', dragged)
        .on('end', (event, d) => dragended(event, d, simulation))
    )
    .on('mouseover', (event, d) => {
      if (config.onMouseOverNode) config.onMouseOverNode(event, d);
    })
    .on('dblclick', (event, d) => {
      if (config.onDoubleClickNode) config.onDoubleClickNode(event, d);
    })
    .on('contextmenu', (event, d) => {
      event.preventDefault();
      if (config.onRightClickNode) config.onRightClickNode(event, d);
    });

  // Add emoji
  selection
    .append('text')
    .attr('class', 'emoji')
    .text((d) => {
      const emoji = d.emoji || (d.meta && d.meta.emoji) || (d.metadata && d.metadata.emoji);
      return emoji && emoji.trim().length > 0 ? emoji : '❓';
    })
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', config.emojiFontSize)
    .attr('fill', (d) => d.color || config.nodeColor);

  // Add label
  selection
    .append('text')
    .attr('class', 'label')
    .text((d) => d.label)
    .attr('text-anchor', 'middle')
    .attr('y', 25)
    .attr('font-size', config.labelFontSize)
    .attr('fill', config.labelColor);

  return selection;
}

/**
 * Updates D3 elements for nodes and links using data joins
 */
function updateElements({
  nodeGroup,
  linkGroup,
  nodes,
  currentEdges,
  config,
  simulation
}: {
  nodeGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  linkGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  nodes: NodeData[];
  currentEdges: EdgeData[];
  config: Config;
  simulation: Simulation<NodeData, undefined>;
}) {
  // Update links
  const linkElements = linkGroup
    .selectAll('line')
    .data(currentEdges, (d: any) => d.id)
    .join(
      (enter) =>
        enter
          .append('line')
          .attr('stroke', (d: any) => d.color || config.linkColor)
          .attr('stroke-width', config.linkStrokeWidth)
          .attr('stroke-opacity', config.linkOpacity)
          .on('mouseover', (event, d) => {
            if (config.onMouseOverEdge) config.onMouseOverEdge(event, d);
          })
          .on('dblclick', (event, d) => {
            if (config.onDoubleClickEdge) config.onDoubleClickEdge(event, d);
          })
          .on('contextmenu', (event, d) => {
            event.preventDefault();
            if (config.onRightClickEdge) config.onRightClickEdge(event, d);
          }),
      (update) => update,
      (exit) => exit.remove()
    );

  // Update nodes
  const nodeElements = nodeGroup
    .selectAll('g')
    .data(nodes, (d: any) => d.id)
    .join(
      (enter) =>
        enter.append('g').call((selection) => createNodeGroup(selection, config, simulation)),
      (update) => update,
      (exit) => exit.remove()
    );

  return { linkElements, nodeElements };
}

/**
 * Tick callback for simulation that updates link and node positions
 */
function ticked({
  linkElements,
  nodeElements
}: {
  linkElements: d3.Selection<SVGLineElement, EdgeData, SVGGElement, unknown>;
  nodeElements: d3.Selection<SVGGElement, NodeData, SVGGElement, unknown>;
}) {
  linkElements
    .attr('x1', (d: any) => (d.source && d.source.x !== undefined ? d.source.x : 0))
    .attr('y1', (d: any) => (d.source && d.source.y !== undefined ? d.source.y : 0))
    .attr('x2', (d: any) => (d.target && d.target.x !== undefined ? d.target.x : 0))
    .attr('y2', (d: any) => (d.target && d.target.y !== undefined ? d.target.y : 0));

  nodeElements.attr('transform', (d) => {
    if (d && d.x !== undefined && d.y !== undefined) {
      return `translate(${d.x},${d.y})`;
    }
    return 'translate(0,0)';
  });
}

/**
 * Adjusts zoom/transform so that all nodes fit into the container
 */
function fitAllIcons(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  zoom: d3.ZoomBehavior<SVGSVGElement, unknown>,
  node: HTMLElement,
  nodes: NodeData[]
) {
  if (!nodes || nodes.length === 0) return;

  const padding = 50;
  const fillFactor = 0.8;

  const minX = d3Min(nodes, (d) => d.x || 0) || 0;
  const maxX = d3Max(nodes, (d) => d.x || 0) || 0;
  const minY = d3Min(nodes, (d) => d.y || 0) || 0;
  const maxY = d3Max(nodes, (d) => d.y || 0) || 0;

  const boxWidth = maxX - minX;
  const boxHeight = maxY - minY;

  const containerWidth = node.offsetWidth;
  const containerHeight = node.offsetHeight;

  let baseScale = Math.min(
    containerWidth / (boxWidth + 2 * padding),
    containerHeight / (boxHeight + 2 * padding)
  );

  const scale = baseScale * fillFactor;
  const translateX = containerWidth / 2 - scale * ((minX + maxX) / 2);
  const translateY = containerHeight / 2 - scale * ((minY + maxY) / 2);

  svg
    .attr('width', containerWidth)
    .attr('height', containerHeight)
    .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`);

  svg
    .transition()
    .duration(750)
    .call(zoom.transform, zoomIdentity.translate(translateX, translateY).scale(scale));
}

// ===================================================================
// PUBLIC API
// ===================================================================

export interface EmojimapHandle {
  update: (params: { nodes?: NodeData[]; edges?: EdgeData[]; config?: Partial<Config> }) => void;
  resetVisualization: () => void;
  updateLayout: () => void;
  destroy: () => void;
}

/**
 * Initializes a force-directed emojimap visualization
 *
 * @param node - The container HTML element
 * @param params - Parameters with nodes, edges, and configuration
 * @returns Public API with methods: update, resetVisualization, updateLayout, destroy
 */
export function forceDirectedEmojimap(
  node: HTMLElement,
  params: { nodes?: NodeData[]; edges?: EdgeData[]; config?: Partial<Config> }
): EmojimapHandle {
  // Validate node
  if (!node) {
    console.error('No DOM node provided to forceDirectedEmojimap');
    return {
      update: () => {},
      resetVisualization: () => {},
      updateLayout: () => {},
      destroy: () => {}
    };
  }

  let { nodes = [], edges = [], config = {} } = params || {};

  // Ensure nodes and edges are arrays
  if (!Array.isArray(nodes)) nodes = [];
  if (!Array.isArray(edges)) edges = [];

  // Merge with default config
  const mergedConfig: Config = { ...defaultConfig, ...config };

  // Process edges with error handling
  let currentEdges = mapEdges(edges);

  // Initialize SVG, groups, and zoom behavior
  const svg = createSvg(node, mergedConfig);
  const g = svg.append('g');
  const zoom = createZoomBehavior(svg, g);
  const { linkGroup, nodeGroup } = createGroups(g);

  // Create node map for linking
  const nodeMap = new Map<string, NodeData>();

  // Validate nodes and build node map
  nodes.forEach((n) => {
    if (!n.id) return;
    nodeMap.set(n.id, n);
  });

  // Map edges to nodes
  currentEdges = currentEdges
    .map((e) => {
      const source = nodeMap.get(e.source as string);
      const target = nodeMap.get(e.target as string);
      if (!source || !target) return null;
      return { ...e, source, target };
    })
    .filter((e): e is EdgeData => e !== null);

  // Initialize simulation
  const simulation = forceSimulation(nodes)
    .force(
      'link',
      forceLink<NodeData, EdgeData>(currentEdges)
        .id((d) => d.id)
        .distance(mergedConfig.linkDistance)
    )
    .force('charge', forceManyBody().strength(mergedConfig.chargeStrength))
    .force('x', forceX(mergedConfig.width / 2).strength(0.05))
    .force('y', forceY(mergedConfig.height / 2).strength(0.05))
    .force('collide', forceCollide(mergedConfig.collisionRadius))
    .on('tick', () => {
      const elems = updateElements({
        nodeGroup,
        linkGroup,
        nodes,
        currentEdges,
        config: mergedConfig,
        simulation
      });
      ticked(elems);
    });

  // Resize handling with debounced fit
  const debouncedFit = debounce(() => fitAllIcons(svg, zoom, node, nodes), 200);
  const resizeObserver = new ResizeObserver(() => {
    debouncedFit();
  });
  resizeObserver.observe(node);

  // Public API
  return {
    update(newParams) {
      if (!newParams) return;

      // Validate and set nodes
      if (Array.isArray(newParams.nodes)) {
        nodes = newParams.nodes;
      }

      // Validate and set edges
      if (Array.isArray(newParams.edges)) {
        edges = newParams.edges;
      }

      // Update config
      Object.assign(mergedConfig, newParams.config || {});

      if (!nodes.length || !edges.length) return;

      // Ensure nodes have initial positions
      nodes.forEach((n) => {
        if (!n.id) return;
        if (n.x == null) n.x = mergedConfig.width / 2;
        if (n.y == null) n.y = mergedConfig.height / 2;
      });

      // Create node map for linking
      const newNodeMap = new Map<string, NodeData>();
      nodes.forEach((n) => {
        if (n && n.id) newNodeMap.set(n.id, n);
      });

      // Map and filter edges
      const mappedEdges = mapEdges(edges);

      currentEdges = mappedEdges
        .map((e) => {
          if (!e.source || !e.target) return null;
          const source = newNodeMap.get(e.source as string);
          const target = newNodeMap.get(e.target as string);
          if (!source || !target) return null;
          return { ...e, source, target };
        })
        .filter((e): e is EdgeData => e !== null);

      // Update simulation
      simulation.nodes(nodes);
      const linkForce = simulation.force('link') as ForceLink<NodeData, EdgeData>;
      if (linkForce) {
        linkForce.links(currentEdges);
      }
      simulation.force('x', forceX(mergedConfig.width / 2).strength(0.05));
      simulation.force('y', forceY(mergedConfig.height / 2).strength(0.05));
      simulation.alpha(1).restart();
    },

    resetVisualization() {
      nodes.forEach((n) => {
        n.fx = null;
        n.fy = null;
      });
      simulation.alpha(1).restart();
    },

    updateLayout() {
      fitAllIcons(svg, zoom, node, nodes);
    },

    destroy() {
      simulation.stop();
      svg.remove();
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    }
  };
}
