/**
 * Dashboard Island - Responsive Masonry Layout
 *
 * Mobile (<768px): Simple flexbox column (no Muuri)
 * Tablet/Desktop (>=768px): Muuri masonry with drag-drop
 * Topic Graph spans full width on all breakpoints
 */

import { useSignalEffect, useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { conversationData } from "../signals/conversationStore.ts";
import VisualizationSelector from "./VisualizationSelector.tsx";
import ShareButton from "./ShareButton.tsx";

// ===================================================================
// COMPONENT
// ===================================================================

export default function DashboardIsland() {
  const gridRef = useRef<HTMLDivElement>(null);
  const muuriRef = useRef<any>(null);
  const boundContainerRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useSignal(false);

  // Action items state
  const sortMode = useSignal<'manual' | 'assignee' | 'date'>('manual');
  const editingItemId = useSignal<string | null>(null);
  const editingDescription = useSignal('');
  const showAddModal = useSignal(false);
  const newItemDescription = useSignal('');
  const newItemAssignee = useSignal('');
  const newItemDueDate = useSignal('');
  const searchQuery = useSignal('');
  const showAssigneeDropdown = useSignal(false);

  // Common assignee names (can be customized)
  const commonAssignees = ['Me', 'Team Lead', 'Developer', 'Designer', 'QA', 'Product Manager', 'Client'];

  // Initialize Muuri only on tablet/desktop (>= 768px)
  useEffect(() => {
    if (!gridRef.current) return;

    const MOBILE_BREAKPOINT = 768;
    let instance: any = null;

    const checkViewport = () => {
      const wasMobile = isMobile.value;
      isMobile.value = window.innerWidth < MOBILE_BREAKPOINT;
      return wasMobile !== isMobile.value; // true if changed
    };

    const initMuuri = async () => {
      if (!gridRef.current) return;

      // Skip Muuri on mobile - use simple flexbox
      if (isMobile.value) {
        gridRef.current.style.display = 'flex';
        gridRef.current.style.flexDirection = 'column';
        gridRef.current.style.gap = '0';
        return;
      }

      try {
        // @ts-ignore - Muuri types not perfect with Deno
        const Muuri = (await import("muuri")).default;

        // Create bounded container for dragging
        const boundContainer = document.createElement('div');
        boundContainer.style.position = 'absolute';
        boundContainer.style.zIndex = '100';
        boundContainer.style.pointerEvents = 'none';
        boundContainer.classList.add('muuri-drag-container');
        document.body.appendChild(boundContainer);
        boundContainerRef.current = boundContainer;

        // Reset grid styles for Muuri
        gridRef.current.style.display = '';
        gridRef.current.style.flexDirection = '';
        gridRef.current.style.gap = '';

        instance = new Muuri(gridRef.current, {
          items: '.dashboard-card',

          // CRITICAL: Use grid-sizer for column width calculation
          columnWidth: '.grid-sizer',

          layoutDuration: 200,
          layoutEasing: 'cubic-bezier(0.17, 0.67, 0.83, 0.67)',
          layoutOnInit: true,

          // Drag settings
          dragEnabled: true,
          dragContainer: boundContainer,
          dragHandle: '.card-handle',
          dragSort: true,
          dragStartPredicate: {
            distance: 5,
            delay: 0
          },
          dragRelease: {
            duration: 200,
            easing: 'cubic-bezier(0.17, 0.67, 0.83, 0.67)',
            useDragContainer: true
          },

          // Layout settings
          layout: {
            fillGaps: false,
            horizontal: false,
            alignRight: false,
            alignBottom: false
          }
        });

        muuriRef.current = instance;

        // Update drag container position on scroll/resize
        const updateDragContainer = () => {
          if (!gridRef.current || !boundContainer) return;
          const rect = gridRef.current.getBoundingClientRect();
          boundContainer.style.top = `${rect.top}px`;
          boundContainer.style.left = `${rect.left}px`;
          boundContainer.style.width = `${rect.width}px`;
          boundContainer.style.height = `${rect.height}px`;
        };

        updateDragContainer();
        window.addEventListener('resize', updateDragContainer);
        window.addEventListener('scroll', updateDragContainer);

        // Clean up listeners on destroy
        instance._cleanup = () => {
          window.removeEventListener('resize', updateDragContainer);
          window.removeEventListener('scroll', updateDragContainer);
        };

      } catch (error) {
        console.error('Failed to initialize Muuri:', error);
      }
    };

    // Handle viewport changes
    const handleResize = () => {
      const viewportChanged = checkViewport();

      if (viewportChanged) {
        // Destroy Muuri if switching to mobile
        if (isMobile.value && instance) {
          instance._cleanup?.();
          instance.destroy();
          instance = null;
          muuriRef.current = null;

          if (boundContainerRef.current) {
            boundContainerRef.current.remove();
            boundContainerRef.current = null;
          }

          // Set up mobile flexbox
          if (gridRef.current) {
            gridRef.current.style.display = 'flex';
            gridRef.current.style.flexDirection = 'column';
            gridRef.current.style.gap = '0';
          }
        }
        // Initialize Muuri if switching to tablet/desktop
        else if (!isMobile.value && !instance) {
          initMuuri();
        }
      }
    };

    // Initial check
    checkViewport();
    initMuuri();

    // Listen for resize
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      if (instance) {
        instance._cleanup?.();
        instance.destroy();
      }
      if (boundContainerRef.current) {
        boundContainerRef.current.remove();
        boundContainerRef.current = null;
      }
    };
  }, []);

  // Refresh layout when data changes (only if Muuri is active)
  useSignalEffect(() => {
    if (conversationData.value && muuriRef.current && !isMobile.value) {
      setTimeout(() => {
        muuriRef.current?.refreshItems().layout();
      }, 100);
    }
  });

  if (!conversationData.value) {
    return (
      <div class="text-center py-12">
        <p class="text-gray-500">No conversation data yet. Upload audio or text to begin.</p>
      </div>
    );
  }

  const { conversation, transcript, actionItems, nodes, summary } = conversationData.value;

  // Filter and sort action items
  const sortedActionItems = (() => {
    let filteredItems = [...actionItems];

    // Apply search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filteredItems = filteredItems.filter(item =>
        item.description.toLowerCase().includes(query) ||
        item.assignee?.toLowerCase().includes(query) ||
        item.due_date?.includes(query)
      );
    }

    const completed = filteredItems.filter(item => item.status === 'completed');
    const pending = filteredItems.filter(item => item.status === 'pending');

    const sortGroup = (items: typeof actionItems) => {
      if (sortMode.value === 'assignee') {
        return items.sort((a, b) => {
          if (!a.assignee && !b.assignee) return 0;
          if (!a.assignee) return 1;
          if (!b.assignee) return -1;
          return a.assignee.localeCompare(b.assignee);
        });
      } else if (sortMode.value === 'date') {
        return items.sort((a, b) => {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return a.due_date.localeCompare(b.due_date);
        });
      }
      return items; // manual order
    };

    return [...sortGroup(pending), ...sortGroup(completed)];
  })();

  // Handle action item checkbox toggle
  function toggleActionItem(itemId: string) {
    if (!conversationData.value) return;

    const updatedItems = conversationData.value.actionItems.map(item =>
      item.id === itemId
        ? { ...item, status: item.status === 'completed' ? 'pending' : 'completed' as const }
        : item
    );

    conversationData.value = {
      ...conversationData.value,
      actionItems: updatedItems
    };
  }

  // Start editing item
  function startEditing(itemId: string, currentDescription: string) {
    editingItemId.value = itemId;
    editingDescription.value = currentDescription;
  }

  // Save edited item
  function saveEdit() {
    if (!conversationData.value || !editingItemId.value) return;

    const updatedItems = conversationData.value.actionItems.map(item =>
      item.id === editingItemId.value
        ? { ...item, description: editingDescription.value }
        : item
    );

    conversationData.value = {
      ...conversationData.value,
      actionItems: updatedItems
    };

    editingItemId.value = null;
    editingDescription.value = '';
  }

  // Cancel editing
  function cancelEdit() {
    editingItemId.value = null;
    editingDescription.value = '';
  }

  // Add new item
  function addNewItem() {
    if (!conversationData.value || !newItemDescription.value.trim()) return;

    const newItem = {
      id: crypto.randomUUID(),
      conversation_id: conversationData.value.conversation.id || '',
      description: newItemDescription.value,
      assignee: newItemAssignee.value || null,
      due_date: newItemDueDate.value || null,
      status: 'pending' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    conversationData.value = {
      ...conversationData.value,
      actionItems: [...conversationData.value.actionItems, newItem]
    };

    // Reset form
    newItemDescription.value = '';
    newItemAssignee.value = '';
    newItemDueDate.value = '';
    showAddModal.value = false;
  }

  // Cycle sort mode
  function cycleSortMode() {
    const modes: Array<'manual' | 'assignee' | 'date'> = ['manual', 'assignee', 'date'];
    const currentIndex = modes.indexOf(sortMode.value);
    sortMode.value = modes[(currentIndex + 1) % modes.length];
  }

  return (
    <div>
      {/* Grid Container - flexbox on mobile, Muuri masonry on tablet/desktop */}
      <div ref={gridRef} class="relative min-h-screen">

        {/* Grid sizer - only used by Muuri on tablet/desktop */}
        {!isMobile.value && (
          <div class="grid-sizer w-full md:w-1/2 lg:w-1/3" style="visibility: hidden; height: 0; position: absolute;"></div>
        )}

        {/* Card 1: Transcript */}
        <div class="dashboard-card w-full md:w-1/2 lg:w-1/3 p-2">
          <div class="bg-white rounded-lg border-4 border-purple-300 shadow-brutal h-full">
            <div class="card-handle bg-purple-400 px-4 py-3 cursor-move border-b-4 border-purple-500">
              <h3 class="font-bold text-white">📝 Transcript</h3>
            </div>
            <div class="p-4 max-h-96 overflow-y-auto">
              <div class="whitespace-pre-wrap text-sm font-mono">
                {transcript.text}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Summary */}
        <div class="dashboard-card w-full md:w-1/2 lg:w-1/3 p-2">
          <div class="bg-white rounded-lg border-4 border-pink-300 shadow-brutal h-full">
            <div class="card-handle bg-pink-400 px-4 py-3 cursor-move border-b-4 border-pink-500 flex justify-between items-center">
              <h3 class="font-bold text-white">📊 Summary</h3>
              <span class="text-xs text-white opacity-75">{conversation.title}</span>
            </div>
            <div class="p-4 max-h-96 overflow-y-auto">
              <p class="text-sm whitespace-pre-wrap">
                {summary || "No summary generated"}
              </p>
              <div class="mt-4 text-xs text-gray-600 border-t pt-2">
                <p>📊 Topics: {nodes.length}</p>
                <p>📝 Source: {conversation.source}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Action Items */}
        <div class="dashboard-card w-full md:w-1/2 lg:w-1/3 p-2">
          <div class="bg-white rounded-lg border-4 border-terminal-green shadow-brutal h-full">
            <div class="card-handle bg-terminal-green px-4 py-3 cursor-move border-b-4 border-green-700 flex justify-between items-center">
              <h3 class="font-bold text-soft-black">✅ Action Items</h3>
              <div class="flex gap-2">
                <button
                  onClick={cycleSortMode}
                  class="text-xs bg-white px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                  title={`Sort: ${sortMode.value}`}
                >
                  {sortMode.value === 'manual' ? '🤚' : sortMode.value === 'assignee' ? '👤' : '📅'}
                </button>
                <button
                  onClick={() => showAddModal.value = true}
                  class="text-xs bg-white px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                  title="Add new item"
                >
                  ➕
                </button>
              </div>
            </div>
            {/* Search bar */}
            <div class="px-4 pt-3 pb-1">
              <input
                type="text"
                value={searchQuery.value}
                onInput={(e) => searchQuery.value = (e.target as HTMLInputElement).value}
                placeholder="🔍 Search items..."
                class="w-full text-xs border-2 border-gray-200 rounded px-2 py-1 focus:border-green-400 focus:outline-none"
              />
            </div>
            <div class="p-4 pt-2 max-h-96 overflow-y-auto">
              {sortedActionItems.length === 0 ? (
                <p class="text-sm text-gray-500">No action items found</p>
              ) : (
                <ul class="space-y-2">
                  {sortedActionItems.map((item, index) => (
                    <li
                      key={item.id}
                      class={`flex items-start gap-2 text-sm p-2 rounded hover:bg-gray-50 transition-all ${
                        item.status === 'completed' ? 'opacity-60' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.status === 'completed'}
                        onChange={() => toggleActionItem(item.id)}
                        class="mt-1 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div class="flex-1 min-w-0">
                        {editingItemId.value === item.id ? (
                          <div class="flex gap-1">
                            <input
                              type="text"
                              value={editingDescription.value}
                              onInput={(e) => editingDescription.value = (e.target as HTMLInputElement).value}
                              class="flex-1 text-xs border rounded px-1"
                              autoFocus
                            />
                            <button onClick={saveEdit} class="text-xs px-1">✓</button>
                            <button onClick={cancelEdit} class="text-xs px-1">✕</button>
                          </div>
                        ) : (
                          <p
                            class={item.status === 'completed' ? 'line-through text-gray-500' : ''}
                            onDblClick={() => startEditing(item.id, item.description)}
                            title="Double-click to edit"
                          >
                            {item.description}
                          </p>
                        )}
                        {(item.assignee || item.due_date) && (
                          <div class="flex flex-wrap gap-2 mt-1">
                            {item.assignee && (
                              <span class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                👤 {item.assignee}
                              </span>
                            )}
                            {item.due_date && (
                              <span class={`text-xs px-2 py-0.5 rounded ${
                                new Date(item.due_date) < new Date()
                                  ? 'bg-red-100 text-red-700'
                                  : new Date(item.due_date) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                📅 {new Date(item.due_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: item.due_date.split('-')[0] !== new Date().getFullYear().toString()
                                    ? 'numeric'
                                    : undefined
                                })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Topic Visualizations - FULL WIDTH (spans all columns) */}
        <div class="dashboard-card w-full p-2">
          <div class="bg-white rounded-lg border-4 border-soft-blue shadow-brutal h-full">
            <div class="card-handle bg-soft-blue px-4 py-3 cursor-move border-b-4 border-blue-700">
              <h3 class="font-bold text-white">📊 Topic Visualizations</h3>
            </div>
            <div class="p-4" style="min-height: 500px;">
              <VisualizationSelector />
            </div>
          </div>
        </div>

        {/* Card 5: Audio Recordings */}
        <div class="dashboard-card w-full md:w-1/2 lg:w-1/3 p-2">
          <div class="bg-white rounded-lg border-4 border-amber shadow-brutal h-full">
            <div class="card-handle bg-amber px-4 py-3 cursor-move border-b-4 border-yellow-700">
              <h3 class="font-bold text-soft-black">🎤 Audio Recordings</h3>
            </div>
            <div class="p-4">
              {conversation.source === 'audio' ? (
                <p class="text-sm">Audio file processed ✓</p>
              ) : (
                <p class="text-sm text-gray-500">No audio uploaded</p>
              )}
            </div>
          </div>
        </div>

        {/* Card 6: Share & Export */}
        <div class="dashboard-card w-full md:w-1/2 lg:w-1/3 p-2">
          <div class="bg-white rounded-lg border-4 border-purple-300 shadow-brutal h-full">
            <div class="card-handle bg-purple-400 px-4 py-3 cursor-move border-b-4 border-purple-500">
              <h3 class="font-bold text-white">🔗 Share & Export</h3>
            </div>
            <div class="p-4">
              <ShareButton />
            </div>
          </div>
        </div>

      </div>

      {/* Add New Item Modal */}
      {showAddModal.value && (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg border-4 border-purple-400 shadow-brutal p-6 max-w-md w-full mx-4">
            <h3 class="text-xl font-bold mb-4">➕ Add New Action Item</h3>

            <div class="space-y-3">
              <div>
                <label class="text-sm font-semibold">Description *</label>
                <input
                  type="text"
                  value={newItemDescription.value}
                  onInput={(e) => newItemDescription.value = (e.target as HTMLInputElement).value}
                  placeholder="What needs to be done?"
                  class="w-full border-2 border-gray-300 rounded px-3 py-2 text-sm"
                  autoFocus
                />
              </div>

              <div class="relative">
                <label class="text-sm font-semibold">Assignee</label>
                <div class="relative">
                  <input
                    type="text"
                    value={newItemAssignee.value}
                    onInput={(e) => newItemAssignee.value = (e.target as HTMLInputElement).value}
                    onFocus={() => showAssigneeDropdown.value = true}
                    onBlur={() => setTimeout(() => showAssigneeDropdown.value = false, 200)}
                    placeholder="Who's responsible?"
                    class="w-full border-2 border-gray-300 rounded px-3 py-2 text-sm pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => showAssigneeDropdown.value = !showAssigneeDropdown.value}
                    class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    ▼
                  </button>
                </div>
                {showAssigneeDropdown.value && (
                  <div class="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded shadow-lg max-h-40 overflow-y-auto">
                    {commonAssignees.map((assignee) => (
                      <button
                        type="button"
                        key={assignee}
                        onClick={() => {
                          newItemAssignee.value = assignee;
                          showAssigneeDropdown.value = false;
                        }}
                        class="w-full text-left px-3 py-2 text-sm hover:bg-purple-100 border-b border-gray-100 last:border-none"
                      >
                        {assignee}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label class="text-sm font-semibold">Due Date</label>
                <input
                  type="date"
                  value={newItemDueDate.value}
                  onInput={(e) => newItemDueDate.value = (e.target as HTMLInputElement).value}
                  class="w-full border-2 border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div class="flex gap-2 mt-6">
              <button
                onClick={addNewItem}
                disabled={!newItemDescription.value.trim()}
                class="flex-1 bg-terminal-green text-soft-black font-bold py-2 px-4 rounded border-2 border-green-700 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Item
              </button>
              <button
                onClick={() => {
                  showAddModal.value = false;
                  newItemDescription.value = '';
                  newItemAssignee.value = '';
                  newItemDueDate.value = '';
                }}
                class="px-4 py-2 border-2 border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
