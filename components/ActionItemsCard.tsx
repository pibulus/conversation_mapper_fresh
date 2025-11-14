/**
 * ActionItemsCard Component
 * Manages and displays action items with full CRUD, drag-and-drop, and sorting
 */

import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { Signal } from "@preact/signals";

interface ActionItem {
  id: string;
  conversation_id: string;
  description: string;
  assignee: string | null;
  due_date: string | null;
  status: 'pending' | 'completed';
  created_at: string;
  updated_at: string;
}

interface ActionItemsCardProps {
  actionItems: ActionItem[];
  onUpdateItems: (items: ActionItem[]) => void;
}

export default function ActionItemsCard({ actionItems, onUpdateItems }: ActionItemsCardProps) {
  // State
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

  // Drag-and-drop state
  const draggedItemId = useSignal<string | null>(null);
  const dragOverItemId = useSignal<string | null>(null);

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

  // Handlers
  function toggleActionItem(itemId: string) {
    const updatedItems = actionItems.map(item =>
      item.id === itemId
        ? { ...item, status: item.status === 'completed' ? 'pending' : 'completed' as const }
        : item
    );
    onUpdateItems(updatedItems);
  }

  function startEditing(itemId: string, currentDescription: string, currentAssignee: string | null, currentDueDate: string | null) {
    editingItemId.value = itemId;
    editingDescription.value = currentDescription;
    editingAssignee.value = currentAssignee || '';
    editingDueDate.value = currentDueDate || '';
  }

  function saveEdit() {
    if (!editingItemId.value) return;

    const updatedItems = actionItems.map(item =>
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

    onUpdateItems(updatedItems);
    editingItemId.value = null;
    editingDescription.value = '';
    editingAssignee.value = '';
    editingDueDate.value = '';
  }

  function cancelEdit() {
    editingItemId.value = null;
    editingDescription.value = '';
    editingAssignee.value = '';
    editingDueDate.value = '';
  }

  function updateAssignee(itemId: string, assignee: string | null) {
    const updatedItems = actionItems.map(item =>
      item.id === itemId
        ? { ...item, assignee, updated_at: new Date().toISOString() }
        : item
    );
    onUpdateItems(updatedItems);
  }

  function updateDueDate(itemId: string, due_date: string | null) {
    const updatedItems = actionItems.map(item =>
      item.id === itemId
        ? { ...item, due_date, updated_at: new Date().toISOString() }
        : item
    );
    onUpdateItems(updatedItems);
  }

  function deleteItem(itemId: string) {
    if (!confirm('Delete this action item?')) return;
    onUpdateItems(actionItems.filter(item => item.id !== itemId));
  }

  function formatFriendlyDate(dateString: string): string {
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  }

  function addNewItem() {
    if (!newItemDescription.value.trim()) return;

    const newItem: ActionItem = {
      id: crypto.randomUUID(),
      conversation_id: actionItems[0]?.conversation_id || '',
      description: newItemDescription.value,
      assignee: newItemAssignee.value || null,
      due_date: newItemDueDate.value || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    onUpdateItems([...actionItems, newItem]);

    // Reset form
    newItemDescription.value = '';
    newItemAssignee.value = '';
    newItemDueDate.value = '';
    showAddModal.value = false;
  }

  function cycleSortMode() {
    const modes: Array<'manual' | 'assignee' | 'date'> = ['manual', 'assignee', 'date'];
    const currentIndex = modes.indexOf(sortMode.value);
    sortMode.value = modes[(currentIndex + 1) % modes.length];
  }

  // Drag-and-drop handlers
  function handleDragStart(e: DragEvent, itemId: string) {
    draggedItemId.value = itemId;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleDragEnd() {
    draggedItemId.value = null;
    dragOverItemId.value = null;
  }

  function handleDragOver(e: DragEvent, itemId: string) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    dragOverItemId.value = itemId;
  }

  function handleDragLeave() {
    dragOverItemId.value = null;
  }

  function handleDrop(e: DragEvent, dropTargetId: string) {
    e.preventDefault();
    if (!draggedItemId.value) return;

    const draggedId = draggedItemId.value;
    if (draggedId === dropTargetId) {
      draggedItemId.value = null;
      dragOverItemId.value = null;
      return;
    }

    // Only reorder if in manual sort mode and both items are pending
    const draggedItem = actionItems.find(item => item.id === draggedId);
    const dropTargetItem = actionItems.find(item => item.id === dropTargetId);

    if (!draggedItem || !dropTargetItem) return;
    if (draggedItem.status === 'completed' || dropTargetItem.status === 'completed') return;

    // Get indices
    const draggedIndex = actionItems.indexOf(draggedItem);
    const dropTargetIndex = actionItems.indexOf(dropTargetItem);

    // Reorder array
    const newItems = [...actionItems];
    newItems.splice(draggedIndex, 1);
    newItems.splice(dropTargetIndex, 0, draggedItem);

    onUpdateItems(newItems);

    draggedItemId.value = null;
    dragOverItemId.value = null;
  }

  return (
    <>
      <div class="w-full">
        <div class="dashboard-card">
          <div class="dashboard-card-header">
            <h3>Action Items</h3>
            <div class="flex gap-2">
              <button
                onClick={cycleSortMode}
                class="bg-white px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                style={{
                  fontSize: 'var(--tiny-size)',
                  transition: 'var(--transition-fast)'
                }}
                title={sortMode.value === 'manual' ? 'Sort: Manual (drag to reorder)' : sortMode.value === 'assignee' ? 'Sort: By assignee' : 'Sort: By due date'}
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
              placeholder="Search"
              class="w-full rounded px-2 py-1 focus:outline-none"
              style={{
                fontSize: 'var(--tiny-size)',
                border: '2px solid var(--color-border)',
                transition: 'var(--transition-fast)'
              }}
            />
            {sortMode.value === 'manual' && (
              <p class="text-xs text-gray-500 mt-1 italic">
                Drag to reorder
              </p>
            )}
          </div>
          <div style={{ padding: '0.5rem var(--card-padding) var(--card-padding)' }} class="max-h-96 overflow-y-auto">
            {sortedActionItems.length === 0 ? (
              <div class="empty-state">
                <div class="empty-state-icon">✓</div>
                <div class="empty-state-text">All clear</div>
              </div>
            ) : (
              <div class="space-y-3">
                {sortedActionItems.map((item) => {
                  const isDragging = draggedItemId.value === item.id;
                  const isDragOver = dragOverItemId.value === item.id;
                  const canDrag = item.status === 'pending' && sortMode.value === 'manual';

                  return (
                    <div
                      key={item.id}
                      draggable={canDrag}
                      onDragStart={(e) => canDrag && handleDragStart(e, item.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => canDrag && handleDragOver(e, item.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => canDrag && handleDrop(e, item.id)}
                      class="relative p-4 rounded-lg bg-white hover:bg-gray-50 transition-all"
                      style={{
                        border: `2px solid ${isDragOver ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        boxShadow: item.status === 'completed' ? 'none' : '2px 2px 0 rgba(0,0,0,0.1)',
                        opacity: isDragging ? '0.5' : '1',
                        cursor: canDrag ? 'move' : 'default'
                      }}
                    >
                      {/* Grid layout with drag handle, checkbox and content */}
                      <div class="grid grid-cols-[auto_auto_1fr] gap-3 items-start">
                        {/* Drag Handle */}
                        <div class="flex items-center pt-1">
                          {canDrag ? (
                            <i
                              class="fa fa-grip-vertical text-gray-400 hover:text-gray-600 cursor-move"
                              title="Drag to reorder"
                              style={{ fontSize: '16px' }}
                            ></i>
                          ) : (
                            <div style={{ width: '16px' }}></div>
                          )}
                        </div>

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
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                class="px-3 py-1 rounded text-xs font-bold"
                                style={{ border: '2px solid var(--color-border)' }}
                              >
                                Cancel
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
                                {item.assignee || 'None'}
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
                                {item.due_date ? formatFriendlyDate(item.due_date) : 'None'}
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add New Item Modal */}
      {showAddModal.value && (
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="dashboard-card max-w-md w-full mx-4" style={{
            padding: 'var(--card-padding)'
          }}>
            <h3 style={{
              fontSize: 'calc(var(--heading-size) * 1.2)',
              fontWeight: 'var(--heading-weight)',
              color: 'var(--color-text)',
              marginBottom: '1rem'
            }}>Add Item</h3>

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
                  placeholder="What to do"
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
                      if (dropdownTimeoutRef.current !== null) {
                        clearTimeout(dropdownTimeoutRef.current);
                      }
                      dropdownTimeoutRef.current = setTimeout(() => {
                        showAssigneeDropdown.value = false;
                        dropdownTimeoutRef.current = null;
                      }, 200) as unknown as number;
                    }}
                    placeholder="Who"
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
    </>
  );
}
