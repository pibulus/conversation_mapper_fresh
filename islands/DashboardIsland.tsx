/**
 * Dashboard Island - Simple CSS Grid Layout
 *
 * Clean 3-column grid (1 on mobile, 2 on tablet, 3 on desktop)
 * Topic Graph spans full width
 */

import { useSignal } from "@preact/signals";
import { conversationData } from "../signals/conversationStore.ts";
import VisualizationSelector from "./VisualizationSelector.tsx";
import { showToast, copyToClipboard } from "../utils/toast.ts";

// ===================================================================
// COMPONENT
// ===================================================================

export default function DashboardIsland() {

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
      {/* Grid Container - Simple CSS Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

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
                <div class="whitespace-pre-wrap font-mono" style={{
                  fontSize: 'var(--text-size)',
                  color: 'var(--color-text)'
                }}>
                  {transcript.text}
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
                <p class="whitespace-pre-wrap" style={{
                  fontSize: 'var(--text-size)',
                  color: 'var(--color-text)',
                  lineHeight: 'var(--line-height)'
                }}>
                  {summary}
                </p>
              )}
              <div class="mt-4 pt-2" style={{
                borderTop: `1px solid var(--color-border)`,
                fontSize: 'var(--small-size)',
                color: 'var(--color-text-secondary)'
              }}>
                <p>📊 Topics: {nodes.length}</p>
                <p>📝 Source: {conversation.source}</p>
              </div>
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
                            class={item.status === 'completed' ? 'line-through' : ''}
                            style={{
                              fontSize: 'var(--text-size)',
                              color: item.status === 'completed' ? 'var(--color-text-secondary)' : 'var(--color-text)'
                            }}
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
                    onBlur={() => setTimeout(() => showAssigneeDropdown.value = false, 200)}
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
