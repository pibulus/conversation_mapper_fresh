/**
 * Dashboard Island - Simple CSS Grid Layout
 *
 * Clean 3-column grid (1 on mobile, 2 on tablet, 3 on desktop)
 * Topic Graph spans full width
 */

import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { conversationData } from "../signals/conversationStore.ts";
import VisualizationSelector from "./VisualizationSelector.tsx";
import { showToast, copyToClipboard } from "../utils/toast.ts";
import { formatTranscriptSafe, formatMarkdownSafe } from "../utils/sanitize.ts";

// ===================================================================
// COMPONENT
// ===================================================================

export default function DashboardIsland() {

  // Action items state
  const sortMode = useSignal<'manual' | 'assignee' | 'date'>('manual');
  const editingItemId = useSignal<string | null>(null);
  const editingDescription = useSignal('');
  const editingAssignee = useSignal('');
  const editingDueDate = useSignal('');
  const showAddModal = useSignal(false);
  const newItemDescription = useSignal('');
  const newItemAssignee = useSignal('');
  const newItemDueDate = useSignal('');
  const searchQuery = useSignal('');
  const showAssigneeDropdown = useSignal(false);
  const activeAssigneeDropdown = useSignal<string | null>(null);

  // Refs for cleanup
  const dropdownTimeoutRef = useRef<number | null>(null);

  // Common assignee names (can be customized)
  const commonAssignees = ['Me', 'Team Lead', 'Developer', 'Designer', 'QA', 'Product Manager', 'Client'];

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current !== null) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  // Click outside to close active dropdown
  useEffect(() => {
    if (activeAssigneeDropdown.value === null) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if click is outside dropdown
      if (!target.closest('.assignee-dropdown-container')) {
        activeAssigneeDropdown.value = null;
      }
    };

    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeAssigneeDropdown.value]);

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
  function startEditing(itemId: string, currentDescription: string, currentAssignee: string | null, currentDueDate: string | null) {
    editingItemId.value = itemId;
    editingDescription.value = currentDescription;
    editingAssignee.value = currentAssignee || '';
    editingDueDate.value = currentDueDate || '';
  }

  // Save edited item
  function saveEdit() {
    if (!conversationData.value || !editingItemId.value) return;

    const updatedItems = conversationData.value.actionItems.map(item =>
      item.id === editingItemId.value
        ? {
            ...item,
            description: editingDescription.value,
            assignee: editingAssignee.value || null,
            due_date: editingDueDate.value || null,
            updated_at: new Date().toISOString()
          }
        : item
    );

    conversationData.value = {
      ...conversationData.value,
      actionItems: updatedItems
    };

    editingItemId.value = null;
    editingDescription.value = '';
    editingAssignee.value = '';
    editingDueDate.value = '';
  }

  // Cancel editing
  function cancelEdit() {
    editingItemId.value = null;
    editingDescription.value = '';
    editingAssignee.value = '';
    editingDueDate.value = '';
  }

  // Update assignee for an item
  function updateAssignee(itemId: string, assignee: string | null) {
    if (!conversationData.value) return;

    const updatedItems = conversationData.value.actionItems.map(item =>
      item.id === itemId
        ? { ...item, assignee, updated_at: new Date().toISOString() }
        : item
    );

    conversationData.value = {
      ...conversationData.value,
      actionItems: updatedItems
    };
  }

  // Update due date for an item
  function updateDueDate(itemId: string, due_date: string | null) {
    if (!conversationData.value) return;

    const updatedItems = conversationData.value.actionItems.map(item =>
      item.id === itemId
        ? { ...item, due_date, updated_at: new Date().toISOString() }
        : item
    );

    conversationData.value = {
      ...conversationData.value,
      actionItems: updatedItems
    };
  }

  // Delete an item
  function deleteItem(itemId: string) {
    if (!conversationData.value) return;
    if (!confirm('Delete this action item?')) return;

    conversationData.value = {
      ...conversationData.value,
      actionItems: conversationData.value.actionItems.filter(item => item.id !== itemId)
    };
  }

  // Format date as friendly "Day, Month Date"
  function formatFriendlyDate(dateString: string): string {
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
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

  // Extract key points from summary
  function extractKeyPoints(text: string): string[] {
    if (!text) return [];

    // Split into paragraphs
    const paragraphs = text.split('\n\n');

    // Short text - extract sentences
    if (paragraphs.length <= 2) {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
      return sentences
        .slice(0, 3)
        .map(s => s.trim())
        .map(s => s.charAt(0).toUpperCase() + s.slice(1));
    }

    // Try to find bullet points
    const bulletPoints = text.match(/- (.+)/g);
    if (bulletPoints && bulletPoints.length >= 2) {
      return bulletPoints
        .slice(0, 3)
        .map(point => point.replace(/^- /, ''));
    }

    // Extract key sentences from paragraphs
    return paragraphs
      .slice(0, 3)
      .map(p => {
        const sentences = p.split(/[.!?]+/);
        return sentences[0].trim();
      })
      .filter(s => s.length > 10)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1));
  }


  return (
    <div>
      {/* Grid Container - Simple CSS Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

        {/* Card 1: Transcript */}
        <div class="w-full">
          <div style={{
            background: 'var(--color-secondary)',
            borderRadius: 'var(--border-radius)',
            border: `var(--border-width) solid var(--color-border)`,
            boxShadow: 'var(--shadow-brutal)',
            height: '100%'
          }}>
            <div style={{
              background: 'var(--color-accent)',
              padding: 'var(--card-padding)',
              borderBottom: `var(--border-width) solid var(--color-border)`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                fontSize: 'var(--heading-size)',
                fontWeight: 'var(--heading-weight)',
                color: 'white'
              }}>📝 Transcript</h3>
              <button
                onClick={() => transcript?.text && copyToClipboard(transcript.text)}
                class="text-white hover:text-gray-200 cursor-pointer"
                style={{ transition: 'var(--transition-fast)' }}
                title="Copy transcript"
                disabled={!transcript?.text}
              >
                <i class="fa fa-copy text-sm"></i>
              </button>
            </div>
            <div style={{ padding: 'var(--card-padding)' }} class="max-h-96 overflow-y-auto">
              {!transcript?.text || transcript.text.trim() === '' ? (
                <div class="flex flex-col items-center justify-center py-8 text-center">
                  <i class="fa fa-file-text-o text-4xl text-gray-300 mb-3"></i>
                  <p style={{
                    fontSize: 'var(--text-size)',
                    fontWeight: '500',
                    color: 'var(--color-text-secondary)'
                  }}>No transcript available</p>
                  <p style={{
                    fontSize: 'var(--small-size)',
                    color: 'var(--color-text-secondary)'
                  }} class="mt-1">Upload a conversation to see the transcript</p>
                </div>
              ) : (
                <div class="relative p-4 rounded-lg bg-white" style={{ border: '2px solid var(--color-border)' }}>
                  {/* Format transcript with speaker highlighting (XSS-safe) */}
                  <div
                    class="whitespace-pre-wrap leading-relaxed"
                    style={{
                      fontSize: 'var(--text-size)',
                      color: 'var(--color-text)',
                      lineHeight: '1.8'
                    }}
                    dangerouslySetInnerHTML={{
                      __html: formatTranscriptSafe(transcript.text)
                    }}
                  />

                  {/* Speaker list if available */}
                  {transcript.speakers && transcript.speakers.length > 0 && (
                    <div class="mt-4 pt-4" style={{ borderTop: '2px solid var(--color-border)' }}>
                      <div style={{ fontSize: 'var(--tiny-size)', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                        Speakers:
                      </div>
                      <div class="flex flex-wrap gap-2">
                        {transcript.speakers.map((speaker) => (
                          <span
                            key={speaker}
                            class="px-2 py-1 rounded text-xs font-medium"
                            style={{
                              background: 'var(--color-accent)',
                              color: 'white',
                              border: '2px solid var(--color-border)'
                            }}
                          >
                            {speaker}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Summary */}
        <div class="w-full">
          <div style={{
            background: 'var(--color-secondary)',
            borderRadius: 'var(--border-radius)',
            border: `var(--border-width) solid var(--color-border)`,
            boxShadow: 'var(--shadow-brutal)',
            height: '100%'
          }}>
            <div style={{
              background: 'var(--color-accent)',
              padding: 'var(--card-padding)',
              borderBottom: `var(--border-width) solid var(--color-border)`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                fontSize: 'var(--heading-size)',
                fontWeight: 'var(--heading-weight)',
                color: 'white'
              }}>📊 Summary</h3>
              <div class="flex items-center gap-2">
                <button
                  onClick={() => summary && copyToClipboard(summary)}
                  class="text-white hover:text-gray-200 cursor-pointer"
                  style={{ transition: 'var(--transition-fast)' }}
                  title="Copy summary"
                  disabled={!summary}
                >
                  <i class="fa fa-copy text-sm"></i>
                </button>
                <span style={{
                  fontSize: 'var(--tiny-size)',
                  color: 'white',
                  opacity: 0.75
                }}>{conversation.title}</span>
              </div>
            </div>
            <div style={{ padding: 'var(--card-padding)' }} class="max-h-96 overflow-y-auto">
              {!summary || summary === "No summary generated" ? (
                <div class="flex flex-col items-center justify-center py-8 text-center">
                  <i class="fa fa-info-circle text-4xl text-gray-300 mb-3"></i>
                  <p style={{
                    fontSize: 'var(--text-size)',
                    fontWeight: '500',
                    color: 'var(--color-text-secondary)'
                  }}>No summary available yet</p>
                  <p style={{
                    fontSize: 'var(--small-size)',
                    color: 'var(--color-text-secondary)'
                  }} class="mt-1">Upload a conversation to generate a summary</p>
                </div>
              ) : (
                <div>
                  {/* Main summary with markdown formatting (XSS-safe) */}
                  <div class="p-4 rounded-lg bg-white" style={{ border: '2px solid var(--color-border)' }}>
                    <div
                      style={{ fontSize: 'var(--text-size)', color: 'var(--color-text)' }}
                      dangerouslySetInnerHTML={{ __html: formatMarkdownSafe(summary) }}
                    />
                  </div>

                  {/* Key Points Section */}
                  {extractKeyPoints(summary).length > 0 && (
                    <div class="mt-4 p-4 rounded-lg" style={{ background: 'rgba(var(--color-accent-rgb), 0.05)', border: '2px solid var(--color-border)' }}>
                      <h4 style={{
                        fontSize: 'var(--text-size)',
                        fontWeight: '700',
                        color: 'var(--color-accent)',
                        marginBottom: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Key Points
                      </h4>
                      <ul class="space-y-2">
                        {extractKeyPoints(summary).map((point, index) => (
                          <li key={index} class="flex items-start gap-2">
                            <span class="flex items-center justify-center rounded" style={{
                              minWidth: '1.25rem',
                              height: '1.25rem',
                              background: 'var(--color-accent)',
                              color: 'white',
                              fontSize: '0.65rem',
                              marginTop: '0.125rem'
                            }}>
                              <i class="fa fa-check"></i>
                            </span>
                            <span style={{ fontSize: 'var(--text-size)', color: 'var(--color-text)', flex: 1 }}>
                              {point}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Metadata */}
                  <div class="mt-4 pt-3 flex items-center gap-4" style={{
                    borderTop: `2px solid var(--color-border)`,
                    fontSize: 'var(--tiny-size)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    <span>📊 {nodes.length} topics</span>
                    <span>•</span>
                    <span>📝 {conversation.source}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Action Items */}
        <div class="w-full">
          <div style={{
            background: 'var(--color-secondary)',
            borderRadius: 'var(--border-radius)',
            border: `var(--border-width) solid var(--color-border)`,
            boxShadow: 'var(--shadow-brutal)',
            height: '100%'
          }}>
            <div style={{
              background: 'var(--color-accent)',
              padding: 'var(--card-padding)',
              borderBottom: `var(--border-width) solid var(--color-border)`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                fontSize: 'var(--heading-size)',
                fontWeight: 'var(--heading-weight)',
                color: 'white'
              }}>✅ Action Items</h3>
              <div class="flex gap-2">
                <button
                  onClick={cycleSortMode}
                  class="bg-white px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                  style={{
                    fontSize: 'var(--tiny-size)',
                    transition: 'var(--transition-fast)'
                  }}
                  title={`Sort: ${sortMode.value}`}
                >
                  {sortMode.value === 'manual' ? '🤚' : sortMode.value === 'assignee' ? '👤' : '📅'}
                </button>
                <button
                  onClick={() => showAddModal.value = true}
                  class="bg-white px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                  style={{
                    fontSize: 'var(--tiny-size)',
                    transition: 'var(--transition-fast)'
                  }}
                  title="Add new item"
                >
                  ➕
                </button>
              </div>
            </div>
            {/* Search bar */}
            <div style={{ padding: '0.75rem 1rem 0.25rem' }}>
              <input
                type="text"
                value={searchQuery.value}
                onInput={(e) => searchQuery.value = (e.target as HTMLInputElement).value}
                placeholder="🔍 Search items..."
                class="w-full rounded px-2 py-1 focus:outline-none"
                style={{
                  fontSize: 'var(--tiny-size)',
                  border: '2px solid var(--color-border)',
                  transition: 'var(--transition-fast)'
                }}
              />
            </div>
            <div style={{ padding: '0.5rem var(--card-padding) var(--card-padding)' }} class="max-h-96 overflow-y-auto">
              {sortedActionItems.length === 0 ? (
                <div class="flex flex-col items-center justify-center py-8 text-center">
                  <i class="fa fa-clipboard-check text-4xl text-gray-300 mb-3"></i>
                  <p style={{
                    fontSize: 'var(--text-size)',
                    fontWeight: '500',
                    color: 'var(--color-text-secondary)'
                  }}>No action items found</p>
                  <p style={{
                    fontSize: 'var(--small-size)',
                    color: 'var(--color-text-secondary)'
                  }} class="mt-1">Add one manually using the + button</p>
                </div>
              ) : (
                <div class="space-y-3">
                  {sortedActionItems.map((item) => (
                    <div
                      key={item.id}
                      class="relative p-4 rounded-lg bg-white hover:bg-gray-50 transition-all"
                      style={{
                        border: '2px solid var(--color-border)',
                        boxShadow: item.status === 'completed' ? 'none' : '2px 2px 0 rgba(0,0,0,0.1)'
                      }}
                    >
                      {/* Improved grid layout with checkbox and content */}
                      <div class="grid grid-cols-[auto_1fr] gap-3 items-start">
                        {/* Checkbox */}
                        <div class="flex items-center pt-1">
                          <input
                            type="checkbox"
                            checked={item.status === 'completed'}
                            onChange={() => toggleActionItem(item.id)}
                            class="cursor-pointer w-5 h-5"
                            style={{ accentColor: 'var(--color-accent)' }}
                          />
                        </div>

                        {/* Content */}
                        <div class="flex flex-col gap-3">
                          {/* Description */}
                          {editingItemId.value === item.id ? (
                            <div class="space-y-2">
                              <textarea
                                value={editingDescription.value}
                                onInput={(e) => editingDescription.value = (e.target as HTMLTextAreaElement).value}
                                class="w-full rounded px-2 py-1 text-sm"
                                style={{ border: '2px solid var(--color-border)', minHeight: '60px' }}
                                autoFocus
                              />
                              <div class="flex gap-2">
                                <button
                                  onClick={saveEdit}
                                  class="px-3 py-1 rounded text-xs font-bold text-white"
                                  style={{ background: 'var(--color-accent)' }}
                                >
                                  ✓ Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  class="px-3 py-1 rounded text-xs font-bold"
                                  style={{ border: '2px solid var(--color-border)' }}
                                >
                                  ✕ Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p
                              class={`leading-relaxed ${item.status === 'completed' ? 'line-through opacity-60' : ''}`}
                              style={{ fontSize: 'var(--text-size)', color: 'var(--color-text)' }}
                              onDblClick={() => startEditing(item.id, item.description, item.assignee, item.due_date)}
                              title="Double-click to edit"
                            >
                              {item.description}
                            </p>
                          )}

                          {/* Metadata row - assignee & due date */}
                          <div class="flex items-center gap-3 flex-wrap">
                            {/* Assignee selector */}
                            <div class="relative assignee-dropdown-container">
                              <button
                                onClick={() => activeAssigneeDropdown.value = activeAssigneeDropdown.value === item.id ? null : item.id}
                                class="flex items-center gap-2 px-3 py-1.5 rounded text-xs hover:bg-gray-100 transition-colors"
                                style={{ border: '2px solid var(--color-border)' }}
                              >
                                <i class="fa fa-user text-xs"></i>
                                <span style={{ color: item.assignee ? 'var(--color-text)' : 'var(--color-text-secondary)' }}>
                                  {item.assignee || 'Unassigned'}
                                </span>
                              </button>
                              {activeAssigneeDropdown.value === item.id && (
                                <div
                                  class="absolute z-10 mt-1 bg-white rounded shadow-lg"
                                  style={{ border: '2px solid var(--color-border)', minWidth: '150px' }}
                                >
                                  <button
                                    onClick={() => {
                                      updateAssignee(item.id, null);
                                      activeAssigneeDropdown.value = null;
                                    }}
                                    class="w-full text-left px-3 py-2 text-xs hover:bg-purple-50"
                                    style={{ borderBottom: '1px solid var(--color-border)' }}
                                  >
                                    None
                                  </button>
                                  {commonAssignees.map((assignee) => (
                                    <button
                                      key={assignee}
                                      onClick={() => {
                                        updateAssignee(item.id, assignee);
                                        activeAssigneeDropdown.value = null;
                                      }}
                                      class="w-full text-left px-3 py-2 text-xs hover:bg-purple-50"
                                      style={{
                                        borderBottom: '1px solid var(--color-border)',
                                        background: item.assignee === assignee ? 'var(--color-accent)' : 'transparent',
                                        color: item.assignee === assignee ? 'white' : 'var(--color-text)'
                                      }}
                                    >
                                      {assignee}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Due date selector */}
                            <div class="relative">
                              <input
                                type="date"
                                id={`date-${item.id}`}
                                value={item.due_date || ''}
                                onChange={(e) => updateDueDate(item.id, (e.target as HTMLInputElement).value || null)}
                                class="absolute opacity-0 pointer-events-none"
                              />
                              <button
                                onClick={() => {
                                  const input = document.getElementById(`date-${item.id}`) as HTMLInputElement | null;
                                  if (input && 'showPicker' in input) {
                                    (input as any).showPicker();
                                  }
                                }}
                                class="flex items-center gap-2 px-3 py-1.5 rounded text-xs hover:bg-gray-100 transition-colors"
                                style={{ border: '2px solid var(--color-border)' }}
                              >
                                <i class="fa fa-calendar text-xs"></i>
                                <span style={{ color: item.due_date ? 'var(--color-text)' : 'var(--color-text-secondary)' }}>
                                  {item.due_date ? formatFriendlyDate(item.due_date) : 'No due date'}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => deleteItem(item.id)}
                        class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <i class="fa fa-times text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Topic Visualizations - FULL WIDTH (spans all columns) */}
        <div class="w-full lg:col-span-3">
          <div style={{
            background: 'var(--color-secondary)',
            borderRadius: 'var(--border-radius)',
            border: `var(--border-width) solid var(--color-border)`,
            boxShadow: 'var(--shadow-brutal)',
            height: '100%'
          }}>
            <div style={{
              background: 'var(--color-accent)',
              padding: 'var(--card-padding)',
              borderBottom: `var(--border-width) solid var(--color-border)`
            }}>
              <h3 style={{
                fontSize: 'var(--heading-size)',
                fontWeight: 'var(--heading-weight)',
                color: 'white'
              }}>📊 Topic Visualizations</h3>
            </div>
            <div style={{ padding: 'var(--card-padding)', minHeight: '500px' }}>
              <VisualizationSelector />
            </div>
          </div>
        </div>

      </div>

      {/* Add New Item Modal */}
      {showAddModal.value && (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="max-w-md w-full mx-4" style={{
            background: 'var(--color-secondary)',
            borderRadius: 'var(--border-radius)',
            border: `var(--border-width) solid var(--color-border)`,
            boxShadow: 'var(--shadow-lifted)',
            padding: 'var(--card-padding)'
          }}>
            <h3 style={{
              fontSize: 'calc(var(--heading-size) * 1.2)',
              fontWeight: 'var(--heading-weight)',
              color: 'var(--color-text)',
              marginBottom: '1rem'
            }}>➕ Add New Action Item</h3>

            <div class="space-y-3">
              <div>
                <label style={{
                  fontSize: 'var(--text-size)',
                  fontWeight: '600',
                  color: 'var(--color-text)'
                }}>Description *</label>
                <input
                  type="text"
                  value={newItemDescription.value}
                  onInput={(e) => newItemDescription.value = (e.target as HTMLInputElement).value}
                  placeholder="What needs to be done?"
                  class="w-full rounded px-3 py-2"
                  style={{
                    fontSize: 'var(--text-size)',
                    border: '2px solid var(--color-border)'
                  }}
                  autoFocus
                />
              </div>

              <div class="relative">
                <label style={{
                  fontSize: 'var(--text-size)',
                  fontWeight: '600',
                  color: 'var(--color-text)'
                }}>Assignee</label>
                <div class="relative">
                  <input
                    type="text"
                    value={newItemAssignee.value}
                    onInput={(e) => newItemAssignee.value = (e.target as HTMLInputElement).value}
                    onFocus={() => showAssigneeDropdown.value = true}
                    onBlur={() => {
                      // Clear any existing timeout
                      if (dropdownTimeoutRef.current !== null) {
                        clearTimeout(dropdownTimeoutRef.current);
                      }
                      // Set new timeout and track it
                      dropdownTimeoutRef.current = setTimeout(() => {
                        showAssigneeDropdown.value = false;
                        dropdownTimeoutRef.current = null;
                      }, 200) as unknown as number;
                    }}
                    placeholder="Who's responsible?"
                    class="w-full rounded px-3 py-2 pr-8"
                    style={{
                      fontSize: 'var(--text-size)',
                      border: '2px solid var(--color-border)'
                    }}
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
                <label style={{
                  fontSize: 'var(--text-size)',
                  fontWeight: '600',
                  color: 'var(--color-text)'
                }}>Due Date</label>
                <input
                  type="date"
                  value={newItemDueDate.value}
                  onInput={(e) => newItemDueDate.value = (e.target as HTMLInputElement).value}
                  class="w-full rounded px-3 py-2"
                  style={{
                    fontSize: 'var(--text-size)',
                    border: '2px solid var(--color-border)'
                  }}
                />
              </div>
            </div>

            <div class="flex gap-2 mt-6">
              <button
                onClick={addNewItem}
                disabled={!newItemDescription.value.trim()}
                class="flex-1 py-2 px-4 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--color-accent)',
                  color: 'white',
                  border: `2px solid var(--color-border)`,
                  fontSize: 'var(--text-size)',
                  transition: 'var(--transition-fast)'
                }}
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
                class="px-4 py-2 rounded hover:bg-gray-100"
                style={{
                  border: `2px solid var(--color-border)`,
                  fontSize: 'var(--text-size)',
                  transition: 'var(--transition-fast)',
                  color: 'var(--color-text)'
                }}
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
