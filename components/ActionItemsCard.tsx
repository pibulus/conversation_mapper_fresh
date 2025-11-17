/**
 * ActionItemsCard Component
 * Manages and displays action items with full CRUD, drag-and-drop, and sorting
 */

import { useSignal, useComputed } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";

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
  const modalRef = useRef<HTMLDivElement>(null);
  const dropdownSelectedIndex = useSignal(0);
  const selectedItemIndex = useSignal<number>(-1);
  const listContainerRef = useRef<HTMLDivElement>(null);

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

  // Keyboard navigation: ESC to close modal
  useEffect(() => {
    if (!showAddModal.value) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        showAddModal.value = false;
        newItemDescription.value = '';
        newItemAssignee.value = '';
        newItemDueDate.value = '';
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showAddModal.value]);

  // Focus trap: Keep Tab within modal
  useEffect(() => {
    if (!showAddModal.value || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }

    modal.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => modal.removeEventListener('keydown', handleTab);
  }, [showAddModal.value]);

  // Filter and sort action items (memoized for performance)
  const sortedActionItems = useComputed(() => {
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
  });

  // Arrow key navigation in action items list
  useEffect(() => {
    if (!listContainerRef.current || sortedActionItems.value.length === 0) return;

    function handleArrowKeys(e: KeyboardEvent) {
      // Only handle if we're not in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedItemIndex.value = Math.min(
          selectedItemIndex.value + 1,
          sortedActionItems.value.length - 1
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedItemIndex.value = Math.max(
          selectedItemIndex.value - 1,
          0
        );
      } else if (e.key === 'Enter' && selectedItemIndex.value >= 0) {
        e.preventDefault();
        const item = sortedActionItems.value[selectedItemIndex.value];
        toggleActionItem(item.id);
      }
    }

    const container = listContainerRef.current;
    container.addEventListener('keydown', handleArrowKeys);

    return () => container.removeEventListener('keydown', handleArrowKeys);
  }, [sortedActionItems.value.length]);

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
                class="btn btn-xs"
                title={sortMode.value === 'manual' ? 'Sort: Manual (drag to reorder)' : sortMode.value === 'assignee' ? 'Sort: By assignee' : 'Sort: By due date'}
              >
                {sortMode.value === 'manual' ? '🤚' : sortMode.value === 'assignee' ? '👤' : '📅'}
              </button>
              <button
                onClick={() => showAddModal.value = true}
                class="btn btn-xs"
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
              <p class="text-xs mt-1 italic" style={{ color: 'var(--color-text-secondary)' }}>
                Drag to reorder
              </p>
            )}
          </div>
          <div
            ref={listContainerRef}
            tabIndex={0}
            style={{ padding: '0.5rem var(--card-padding) var(--card-padding)' }}
            class="max-h-96 overflow-y-auto focus:outline-none"
          >
            {sortedActionItems.value.length === 0 ? (
              <div class="empty-state">
                <div class="empty-state-icon">✓</div>
                <div class="empty-state-text">All clear</div>
              </div>
            ) : (
              <div class="space-y-3">
                {sortedActionItems.value.map((item, index) => {
                  const isDragging = draggedItemId.value === item.id;
                  const isDragOver = dragOverItemId.value === item.id;
                  const canDrag = item.status === 'pending' && sortMode.value === 'manual';
                  const isSelected = selectedItemIndex.value === index;

                  return (
                    <div
                      key={item.id}
                      draggable={canDrag}
                      onDragStart={(e) => canDrag && handleDragStart(e, item.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => canDrag && handleDragOver(e, item.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => canDrag && handleDrop(e, item.id)}
                      onClick={() => selectedItemIndex.value = index}
                      class="relative p-4 rounded-lg transition-all"
                      style={{
                        background: 'var(--surface-cream)',
                        border: `2px solid ${isSelected ? 'var(--color-accent)' : isDragOver ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        boxShadow: item.status === 'completed' ? 'none' : 'var(--shadow-sm)',
                        opacity: isDragging ? '0.5' : '1',
                        cursor: canDrag ? 'move' : 'default',
                        outline: isSelected ? `2px solid var(--color-accent)` : 'none',
                        outlineOffset: '2px'
                      }}
                      onMouseEnter={(e) => !item.status && (e.currentTarget.style.background = 'var(--surface-cream-hover)')}
                      onMouseLeave={(e) => !item.status && (e.currentTarget.style.background = 'var(--surface-cream)')}
                    >
                      {/* Grid layout with drag handle, checkbox and content */}
                      <div class="grid grid-cols-[auto_auto_1fr] gap-3 items-start">
                        {/* Drag Handle */}
                        <div class="flex items-center pt-1">
                          {canDrag ? (
                            <i
                              class="fa fa-grip-vertical cursor-move"
                              title="Drag to reorder"
                              style={{
                                fontSize: '16px',
                                color: 'var(--color-text-secondary)',
                                transition: 'color var(--transition-fast)'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
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
                              class="btn btn-xs flex items-center gap-2"
                            >
                              <i class="fa fa-user text-xs"></i>
                              <span style={{ color: item.assignee ? 'var(--color-text)' : 'var(--color-text-secondary)' }}>
                                {item.assignee || 'None'}
                              </span>
                            </button>
                            {activeAssigneeDropdown.value === item.id && (
                              <div
                                class="absolute z-10 mt-1 rounded"
                                style={{
                                  border: '2px solid var(--color-border)',
                                  minWidth: '150px',
                                  background: 'var(--surface-white-warm)',
                                  boxShadow: 'var(--shadow-md)'
                                }}
                              >
                                <button
                                  onClick={() => {
                                    updateAssignee(item.id, null);
                                    activeAssigneeDropdown.value = null;
                                  }}
                                  class="w-full text-left px-3 py-2 text-xs transition-colors"
                                  style={{
                                    borderBottom: '1px solid var(--color-border)',
                                    background: 'transparent'
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(var(--color-accent-rgb), 0.08)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
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
                                    class="w-full text-left px-3 py-2 text-xs transition-colors"
                                    style={{
                                      borderBottom: '1px solid var(--color-border)',
                                      background: item.assignee === assignee ? 'var(--color-accent)' : 'transparent',
                                      color: item.assignee === assignee ? 'white' : 'var(--color-text)'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (item.assignee !== assignee) {
                                        e.currentTarget.style.background = 'rgba(var(--color-accent-rgb), 0.08)';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (item.assignee !== assignee) {
                                        e.currentTarget.style.background = 'transparent';
                                      }
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
                              class="btn btn-xs flex items-center gap-2"
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
                      class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full transition-colors"
                      style={{
                        background: 'var(--surface-cream-hover)',
                        color: 'var(--soft-brown)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#FFE5E5';
                        e.currentTarget.style.color = '#C74444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--surface-cream-hover)';
                        e.currentTarget.style.color = 'var(--soft-brown)';
                      }}
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
          <div ref={modalRef} class="dashboard-card max-w-md w-full mx-4" style={{
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newItemDescription.value.trim()) {
                      e.preventDefault();
                      addNewItem();
                    }
                  }}
                  placeholder="What's the move?"
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
                    onFocus={() => {
                      showAssigneeDropdown.value = true;
                      dropdownSelectedIndex.value = 0;
                    }}
                    onBlur={() => {
                      if (dropdownTimeoutRef.current !== null) {
                        clearTimeout(dropdownTimeoutRef.current);
                      }
                      dropdownTimeoutRef.current = setTimeout(() => {
                        showAssigneeDropdown.value = false;
                        dropdownTimeoutRef.current = null;
                      }, 200) as unknown as number;
                    }}
                    onKeyDown={(e) => {
                      if (!showAssigneeDropdown.value) return;

                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        dropdownSelectedIndex.value = Math.min(
                          dropdownSelectedIndex.value + 1,
                          commonAssignees.length - 1
                        );
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        dropdownSelectedIndex.value = Math.max(
                          dropdownSelectedIndex.value - 1,
                          0
                        );
                      } else if (e.key === 'Enter' && showAssigneeDropdown.value) {
                        e.preventDefault();
                        newItemAssignee.value = commonAssignees[dropdownSelectedIndex.value];
                        showAssigneeDropdown.value = false;
                      }
                    }}
                    placeholder="Who's on it?"
                    class="w-full rounded px-3 py-2 pr-8"
                    style={{
                      fontSize: 'var(--text-size)',
                      border: '2px solid var(--color-border)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => showAssigneeDropdown.value = !showAssigneeDropdown.value}
                    class="absolute right-2 top-1/2 transform -translate-y-1/2"
                    style={{ color: 'var(--color-text-secondary)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                  >
                    ▼
                  </button>
                </div>
                {showAssigneeDropdown.value && (
                  <div
                    class="absolute z-10 w-full mt-1 rounded max-h-40 overflow-y-auto"
                    style={{
                      background: 'var(--surface-white-warm)',
                      border: '2px solid var(--color-border)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    {commonAssignees.map((assignee, index) => (
                      <button
                        type="button"
                        key={assignee}
                        onClick={() => {
                          newItemAssignee.value = assignee;
                          showAssigneeDropdown.value = false;
                        }}
                        class="w-full text-left px-3 py-2 text-sm transition-colors last:border-none"
                        style={{
                          background: index === dropdownSelectedIndex.value ? 'var(--color-accent)' : 'transparent',
                          color: index === dropdownSelectedIndex.value ? 'white' : 'var(--color-text)',
                          borderBottom: '1px solid var(--color-border)'
                        }}
                        onMouseEnter={(e) => {
                          if (index !== dropdownSelectedIndex.value) {
                            e.currentTarget.style.background = 'rgba(var(--color-accent-rgb), 0.08)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (index !== dropdownSelectedIndex.value) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
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
                class="btn btn-primary flex-1"
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
                class="btn"
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
