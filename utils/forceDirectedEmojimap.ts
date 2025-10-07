/**
 * Force-Directed Emojimap Visualization
 *
 * D3-based force simulation for topic graphs with emoji nodes
 * Ported from Svelte conversation_mapper implementation
 */

import * as d3 from "d3";

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
  backgroundColor: '#fff',
  linkColor: '#000',
  linkStrokeWidth: 3,
  linkOpacity: 1,
  nodeColor: 'steelblue',
  emojiFontSize: '28px',
  labelFontSize: '14px',
  labelColor: '#333',
  linkDistance: 100,
  chargeStrength: -1500,
  collisionRadius: 50,
  onMouseOverNode: (event, d) => {
    console.log('Mouse over node:', d.id);
  },
  onDoubleClickNode: (event, d) => {
    console.log('Double clicked node:', d.id);
  },
  onRightClickNode: (event, d) => {
    console.log('Right clicked node:', d.id);
  },
  onMouseOverEdge: (event, d) => {
    console.log('Mouse over edge:', d.id);
  },
  onDoubleClickEdge: (event, d) => {
    console.log('Double clicked edge:', d.id);
  },
  onRightClickEdge: (event, d) => {
    console.log('Right clicked edge:', d.id);
  },
  onBackgroundClick: (event) => {
    console.log('Background clicked. pointerType: ', event.pointerType);
  },
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
  if (!edges || !Array.isArray(edges)) {
    console.warn('Invalid edges data passed to mapEdges:', edges);
    return [];
  }

  return edges.map((edge, i) => {
    if (!edge) {
      console.warn('Null or undefined edge in mapEdges at index', i);
      return null;
    }

    const sourceId = edge.sourceTopicId || edge.source_topic_id || (typeof edge.source === 'string' ? edge.source : '');
    const targetId = edge.targetTopicId || edge.target_topic_id || (typeof edge.target === 'string' ? edge.target : '');

    if (!sourceId || !targetId) {
      console.warn('Edge missing source or target ID:', edge);
      return null;
    }

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
function dragstarted(event: any, d: NodeData, simulation: d3.Simulation<NodeData, undefined>) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(event: any, d: NodeData) {
  d.fx = event.x;
  d.fy = event.y;
}

function dragended(event: any, d: NodeData, simulation: d3.Simulation<NodeData, undefined>) {
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
  simulation: d3.Simulation<NodeData, undefined>
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
  simulation: d3.Simulation<NodeData, undefined>;
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

  const minX = d3.min(nodes, (d) => d.x || 0) || 0;
  const maxX = d3.max(nodes, (d) => d.x || 0) || 0;
  const minY = d3.min(nodes, (d) => d.y || 0) || 0;
  const maxY = d3.max(nodes, (d) => d.y || 0) || 0;

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
    .call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY).scale(scale));
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
  if (!Array.isArray(nodes)) {
    console.warn('Nodes is not an array, defaulting to empty array');
    nodes = [];
  }

  if (!Array.isArray(edges)) {
    console.warn('Edges is not an array, defaulting to empty array');
    edges = [];
  }

  // Merge with default config
  const mergedConfig: Config = { ...defaultConfig, ...config };

  // Process edges with error handling
  let currentEdges = mapEdges(edges);
  console.log(`[Emojimap] Mapped ${currentEdges.length} edges from ${edges.length} raw edges`);

  // Initialize SVG, groups, and zoom behavior
  const svg = createSvg(node, mergedConfig);
  const g = svg.append('g');
  const zoom = createZoomBehavior(svg, g);
  const { linkGroup, nodeGroup } = createGroups(g);

  // Create node map for linking
  const nodeMap = new Map<string, NodeData>();

  // Validate nodes and build node map
  nodes.forEach((n) => {
    if (!n.id) {
      console.warn('Node missing ID, skipping:', n);
      return;
    }
    nodeMap.set(n.id, n);
  });

  console.log(`[Emojimap] Created node map with ${nodeMap.size} nodes`);

  // Map edges to nodes
  currentEdges = currentEdges
    .map((e) => {
      const source = nodeMap.get(e.source as string);
      const target = nodeMap.get(e.target as string);

      if (!source || !target) {
        console.warn(
          `Edge references missing node: ${!source ? 'source' : 'target'} missing`,
          e
        );
        return null;
      }

      return {
        ...e,
        source,
        target
      };
    })
    .filter((e): e is EdgeData => e !== null);

  console.log(`[Emojimap] Final edge count: ${currentEdges.length}`);

  // Initialize simulation
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3
        .forceLink<NodeData, EdgeData>(currentEdges)
        .id((d) => d.id)
        .distance(mergedConfig.linkDistance)
    )
    .force('charge', d3.forceManyBody().strength(mergedConfig.chargeStrength))
    .force('x', d3.forceX(mergedConfig.width / 2).strength(0.05))
    .force('y', d3.forceY(mergedConfig.height / 2).strength(0.05))
    .force('collide', d3.forceCollide(mergedConfig.collisionRadius))
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
      console.log(
        '[Emojimap] Update called with params:',
        newParams?.nodes?.length || 0,
        'nodes',
        newParams?.edges?.length || 0,
        'edges'
      );

      if (!newParams) {
        console.warn('[Emojimap] Update called with no parameters');
        return;
      }

      // Validate and set nodes
      if (Array.isArray(newParams.nodes)) {
        nodes = newParams.nodes;
      } else {
        console.warn('[Emojimap] Update called with invalid nodes:', newParams.nodes);
      }

      // Validate and set edges
      if (Array.isArray(newParams.edges)) {
        edges = newParams.edges;
      } else {
        console.warn('[Emojimap] Update called with invalid edges:', newParams.edges);
      }

      // Update config
      Object.assign(mergedConfig, newParams.config || {});

      if (!nodes.length || !edges.length) {
        console.warn(
          '[Emojimap] Update skipped: nodes or edges empty.',
          nodes.length,
          'nodes,',
          edges.length,
          'edges'
        );
        return;
      }

      // Ensure nodes have initial positions
      nodes.forEach((n) => {
        if (!n.id) {
          console.warn('[Emojimap] Node missing ID:', n);
          return;
        }
        if (n.x == null) n.x = mergedConfig.width / 2;
        if (n.y == null) n.y = mergedConfig.height / 2;
      });

      // Create node map for linking
      const newNodeMap = new Map<string, NodeData>();
      nodes.forEach((n) => {
        if (n && n.id) newNodeMap.set(n.id, n);
      });

      console.log(`[Emojimap] Update: node map has ${newNodeMap.size} nodes`);

      // Map and filter edges
      const mappedEdges = mapEdges(edges);
      console.log(
        `[Emojimap] Update: mapped ${mappedEdges.length} edges from ${edges.length} raw edges`
      );

      currentEdges = mappedEdges
        .map((e) => {
          if (!e.source || !e.target) return null;

          const source = newNodeMap.get(e.source as string);
          const target = newNodeMap.get(e.target as string);

          if (!source || !target) {
            console.warn(
              `[Emojimap] Edge references missing node:`,
              !source ? `source (${e.source})` : `target (${e.target})`
            );
            return null;
          }

          return {
            ...e,
            source,
            target
          };
        })
        .filter((e): e is EdgeData => e !== null);

      console.log(`[Emojimap] Update: final edge count ${currentEdges.length}`);

      // Update simulation
      simulation.nodes(nodes);
      const linkForce = simulation.force('link') as d3.ForceLink<NodeData, EdgeData>;
      if (linkForce) {
        linkForce.links(currentEdges);
      }
      simulation.force('x', d3.forceX(mergedConfig.width / 2).strength(0.05));
      simulation.force('y', d3.forceY(mergedConfig.height / 2).strength(0.05));
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
