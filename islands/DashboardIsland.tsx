/**
 * Dashboard Island - Muuri Masonry Layout
 *
 * 4 draggable cards: Transcript, Summary, Action Items, Audio Recordings
 * Uses Muuri for drag-drop masonry layout
 */

import { useSignalEffect, useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { conversationData } from "../signals/conversationStore.ts";

// ===================================================================
// COMPONENT
// ===================================================================

export default function DashboardIsland() {
  const gridRef = useRef<HTMLDivElement>(null);
  const muuriRef = useRef<any>(null);
  const draggedIndex = useSignal<number | null>(null);
  const draggedItemId = useSignal<string | null>(null);

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
            <div class="card-handle bg-terminal-green px-4 py-3 cursor-move border-b-4 border-green-700">
              <h3 class="font-bold text-soft-black">✅ Action Items</h3>
            </div>
            <div class="p-4 max-h-96 overflow-y-auto">
              {actionItems.length === 0 ? (
                <p class="text-sm text-gray-500">No action items found</p>
              ) : (
                <ul class="space-y-2">
                  {actionItems.map((item, index) => (
                    <li
                      key={item.id}
                      class="flex items-start gap-2 text-sm p-2 rounded hover:bg-gray-50 transition-colors cursor-move"
                      draggable={true}
                      onDragStart={() => handleDragStart(index, item.id)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      style={{
                        opacity: draggedIndex.value === index ? 0.5 : 1
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={item.status === 'completed'}
                        onChange={() => toggleActionItem(item.id)}
                        class="mt-1 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div class="flex-1">
                        <p class={item.status === 'completed' ? 'line-through text-gray-500' : ''}>
                          {item.description}
                        </p>
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

        {/* Card 4: Audio Recordings */}
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
    </div>
  );
}
