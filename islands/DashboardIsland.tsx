/**
 * Dashboard Island - Muuri Masonry Layout
 *
 * 4 draggable cards: Transcript, Summary, Action Items, Audio Recordings
 * Uses Muuri for drag-drop masonry layout
 */

import { useSignalEffect, useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { conversationData } from "../signals/conversationStore.ts";
import EmojimapViz from "./EmojimapViz.tsx";

// ===================================================================
// COMPONENT
// ===================================================================

export default function DashboardIsland() {
  const gridRef = useRef<HTMLDivElement>(null);
  const muuriRef = useRef<any>(null);
  const draggedIndex = useSignal<number | null>(null);
  const draggedItemId = useSignal<string | null>(null);

  // Action items state
  const sortMode = useSignal<'manual' | 'assignee' | 'date'>('manual');
  const editingItemId = useSignal<string | null>(null);
  const editingDescription = useSignal('');
  const showAddModal = useSignal(false);
  const newItemDescription = useSignal('');
  const newItemAssignee = useSignal('');
  const newItemDueDate = useSignal('');

  // Initialize Muuri on mount
  useEffect(() => {
    if (!gridRef.current) return;

    let instance: any = null;

    const initMuuri = async () => {
      try {
        // @ts-ignore - Muuri types not perfect with Deno
        const Muuri = (await import("muuri")).default;

        instance = new Muuri(gridRef.current, {
          items: '.dashboard-card',
          layoutDuration: 200,
          layoutEasing: 'cubic-bezier(0.17, 0.67, 0.83, 0.67)',
          layoutOnInit: true,
          dragEnabled: true,
          dragHandle: '.card-handle',
          dragSort: true,
          dragStartPredicate: {
            distance: 5,
            delay: 0
          },
          dragRelease: {
            duration: 200,
            easing: 'cubic-bezier(0.17, 0.67, 0.83, 0.67)'
          },
          layout: {
            fillGaps: false,
            horizontal: false
          }
        });

        muuriRef.current = instance;
      } catch (error) {
        console.error('Failed to initialize Muuri:', error);
      }
    };

    initMuuri();

    return () => {
      if (instance) {
        instance.destroy();
      }
    };
  }, []);

  // Refresh layout when data changes
  useSignalEffect(() => {
    if (conversationData.value && muuriRef.current) {
      setTimeout(() => {
        muuriRef.current?.layout();
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

  // Sort action items
  const sortedActionItems = (() => {
    const completed = actionItems.filter(item => item.status === 'completed');
    const pending = actionItems.filter(item => item.status === 'pending');

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

  // Handle drag start
  function handleDragStart(index: number, itemId: string) {
    draggedIndex.value = index;
    draggedItemId.value = itemId;
  }

  // Handle drag over
  function handleDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex.value === null) return;

    // Visual feedback - could add hover styles here
  }

  // Handle drop
  function handleDrop(e: DragEvent, targetIndex: number) {
    e.preventDefault();
    if (draggedIndex.value === null || !conversationData.value) return;

    const items = [...conversationData.value.actionItems];
    const [movedItem] = items.splice(draggedIndex.value, 1);
    items.splice(targetIndex, 0, movedItem);

    conversationData.value = {
      ...conversationData.value,
      actionItems: items
    };

    draggedIndex.value = null;
    draggedItemId.value = null;
  }

  return (
    <div>
      {/* Grid Container */}
      <div ref={gridRef} class="relative min-h-screen">

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
            <div class="p-4 max-h-96 overflow-y-auto">
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
                      draggable={sortMode.value === 'manual'}
                      onDragStart={() => handleDragStart(index, item.id)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      style={{
                        opacity: draggedIndex.value === index ? 0.5 : 1,
                        cursor: sortMode.value === 'manual' ? 'move' : 'default'
                      }}
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
                        {item.assignee && (
                          <p class="text-xs text-gray-600">👤 {item.assignee}</p>
                        )}
                        {item.due_date && (
                          <p class="text-xs text-gray-600">📅 {item.due_date}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Topic Graph */}
        <div class="dashboard-card w-full md:w-1/2 lg:w-1/3 p-2">
          <div class="bg-white rounded-lg border-4 border-soft-blue shadow-brutal h-full">
            <div class="card-handle bg-soft-blue px-4 py-3 cursor-move border-b-4 border-blue-700">
              <h3 class="font-bold text-white">🕸️ Topic Map</h3>
            </div>
            <div class="p-4 max-h-96 overflow-y-auto">
              <EmojimapViz />
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

              <div>
                <label class="text-sm font-semibold">Assignee</label>
                <input
                  type="text"
                  value={newItemAssignee.value}
                  onInput={(e) => newItemAssignee.value = (e.target as HTMLInputElement).value}
                  placeholder="Who's responsible?"
                  class="w-full border-2 border-gray-300 rounded px-3 py-2 text-sm"
                />
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
