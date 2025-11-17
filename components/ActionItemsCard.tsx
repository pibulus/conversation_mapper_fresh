/**
 * ActionItemsCard Component
 * Manages and displays action items with full CRUD, drag-and-drop, and sorting
 */

import { useSignal, useComputed } from "@preact/signals";
import { useEffect, useRef, useMemo } from "preact/hooks";
import { showToast } from "../utils/toast.ts";
import { conversationData } from "../signals/conversationStore.ts";

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
  const showExportDropdown = useSignal(false);

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

  // State for undo functionality
  const undoTimeout = useRef<number | null>(null);
  const undoAction = useSignal<{ type: 'delete' | 'complete', item: ActionItem } | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current !== null) {
        clearTimeout(dropdownTimeoutRef.current);
      }
      if (undoTimeout.current !== null) {
        clearTimeout(undoTimeout.current);
      }
    };
  }, []);

  // Click outside to close export dropdown
  useEffect(() => {
    if (!showExportDropdown.value) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.relative')) {
        showExportDropdown.value = false;
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showExportDropdown.value]);

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
  // Using useMemo since we depend on props, not just signals
  const sortedActionItems = useMemo(() => {
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
  }, [actionItems, searchQuery.value, sortMode.value]);

  // Arrow key navigation in action items list
  useEffect(() => {
    if (!listContainerRef.current || sortedActionItems.length === 0) return;

    function handleArrowKeys(e: KeyboardEvent) {
      // Only handle if we're not in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedItemIndex.value = Math.min(
          selectedItemIndex.value + 1,
          sortedActionItems.length - 1
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedItemIndex.value = Math.max(
          selectedItemIndex.value - 1,
          0
        );
      } else if (e.key === 'Enter' && selectedItemIndex.value >= 0) {
        e.preventDefault();
        const item = sortedActionItems[selectedItemIndex.value];
        toggleActionItem(item.id);
      }
    }

    const container = listContainerRef.current;
    container.addEventListener('keydown', handleArrowKeys);

    return () => container.removeEventListener('keydown', handleArrowKeys);
  }, [sortedActionItems.length]);

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

    showToast('Changes saved', 'success');
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
    const itemToDelete = actionItems.find(item => item.id === itemId);
    if (!itemToDelete) return;

    // Clear any pending undo
    if (undoTimeout.current !== null) {
      clearTimeout(undoTimeout.current);
    }

    // Store for undo
    undoAction.value = { type: 'delete', item: itemToDelete };

    // Remove item
    onUpdateItems(actionItems.filter(item => item.id !== itemId));

    // Clear undo after timeout
    undoTimeout.current = setTimeout(() => {
      undoAction.value = null;
      undoTimeout.current = null;
    }, 4000) as unknown as number;
  }

  function undoDelete() {
    if (!undoAction.value || undoAction.value.type !== 'delete') return;

    const item = undoAction.value.item;
    onUpdateItems([...actionItems, item]);
    undoAction.value = null;

    if (undoTimeout.current !== null) {
      clearTimeout(undoTimeout.current);
      undoTimeout.current = null;
    }

    showToast('Action item restored', 'success');
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
      conversation_id: conversationData.value?.conversation.id || '',
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

    // Show success toast
    showToast('Action item added!', 'success');
  }

  function cycleSortMode() {
    const modes: Array<'manual' | 'assignee' | 'date'> = ['manual', 'assignee', 'date'];
    const currentIndex = modes.indexOf(sortMode.value);
    sortMode.value = modes[(currentIndex + 1) % modes.length];
  }

  function exportAsJSON() {
    const data = JSON.stringify(actionItems, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `action-items-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Action items exported as JSON', 'success');
  }

  function exportAsCSV() {
    // CSV header
    const headers = ['Description', 'Assignee', 'Due Date', 'Status', 'Created', 'Updated'];
    const rows = actionItems.map(item => [
      `"${item.description.replace(/"/g, '""')}"`, // Escape quotes
      item.assignee || '',
      item.due_date || '',
      item.status,
      new Date(item.created_at).toLocaleDateString(),
      new Date(item.updated_at).toLocaleDateString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `action-items-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Action items exported as CSV', 'success');
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
                aria-label={sortMode.value === 'manual' ? 'Sort by manual order, drag to reorder' : sortMode.value === 'assignee' ? 'Sort by assignee' : 'Sort by due date'}
              >
                {sortMode.value === 'manual' ? '🤚' : sortMode.value === 'assignee' ? '👤' : '📅'}
              </button>

              {/* Export dropdown */}
              <div class="relative" style={{ display: 'inline-block' }}>
                <button
                  onClick={() => showExportDropdown.value = !showExportDropdown.value}
                  class="btn btn-xs"
                  title="Export action items"
                  aria-label="Export action items"
                >
                  📥
                </button>
                {showExportDropdown.value && (
                  <div
                    class="absolute right-0 mt-1 rounded-lg shadow-lg z-50"
                    style={{
                      background: 'var(--color-secondary)',
                      border: '2px solid var(--color-border)',
                      minWidth: '120px'
                    }}
                  >
                    <button
                      onClick={() => {
                        exportAsJSON();
                        showExportDropdown.value = false;
                      }}
                      class="w-full text-left px-3 py-2 hover:bg-white/30 transition-colors"
                      style={{
                        fontSize: 'var(--small-size)',
                        color: 'var(--color-text)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '6px 6px 0 0'
                      }}
                    >
                      📄 Export JSON
                    </button>
                    <button
                      onClick={() => {
                        exportAsCSV();
                        showExportDropdown.value = false;
                      }}
                      class="w-full text-left px-3 py-2 hover:bg-white/30 transition-colors"
                      style={{
                        fontSize: 'var(--small-size)',
                        color: 'var(--color-text)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '0 0 6px 6px'
                      }}
                    >
                      📊 Export CSV
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => showAddModal.value = true}
                class="btn btn-xs"
                title="Add new item"
                aria-label="Add new action item"
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
            {sortedActionItems.length === 0 ? (
              <div class="empty-state">
                <div class="empty-state-icon">✓</div>
                <div class="empty-state-text">All clear</div>
              </div>
            ) : (
              <div class="space-y-3">
                {sortedActionItems.map((item, index) => {
                  const isDragging = draggedItemId.value === item.id;
                  const isDragOver = dragOverItemId.value === item.id;
                  const canDrag = item.status === 'pending' && sortMode.value === 'manual';
                  const isSelected = selectedItemIndex.value === index;

                  // Check if this is the first completed item (show separator)
                  const isFirstCompleted = item.status === 'completed' &&
                    (index === 0 || sortedActionItems[index - 1].status === 'pending');

                  return (
                    <>
                      {isFirstCompleted && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            margin: '1.5rem 0',
                            color: 'var(--color-text-secondary)',
                            fontSize: 'var(--tiny-size)',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}
                        >
                          <div style={{
                            flex: 1,
                            height: '1px',
                            background: 'var(--color-border)'
                          }}></div>
                          <span>Completed</span>
                          <div style={{
                            flex: 1,
                            height: '1px',
                            background: 'var(--color-border)'
                          }}></div>
                        </div>
                      )}
                      <div
                      key={item.id}
                      draggable={canDrag}
                      onDragStart={(e) => canDrag && handleDragStart(e, item.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => canDrag && handleDragOver(e, item.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => canDrag && handleDrop(e, item.id)}
                      onClick={() => selectedItemIndex.value = index}
                      class="group relative p-4 rounded-lg transition-all"
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
                          <div class="flex items-start gap-2">
                            <p
                              class={`leading-relaxed flex-1 ${item.status === 'completed' ? 'line-through opacity-60' : ''}`}
                              style={{ fontSize: 'var(--text-size)', color: 'var(--color-text)' }}
                              onDblClick={() => startEditing(item.id, item.description, item.assignee, item.due_date)}
                              title="Double-click to edit"
                            >
                              {item.description}
                            </p>
                            {item.status === 'pending' && (
                              <button
                                onClick={() => startEditing(item.id, item.description, item.assignee, item.due_date)}
                                class="opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{
                                  padding: '0.25rem',
                                  color: 'var(--color-text-secondary)',
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                                title="Edit item"
                                aria-label="Edit action item"
                              >
                                <i class="fa fa-pencil text-xs"></i>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Metadata row - assignee & due date */}
                        <div class="flex items-center gap-3 flex-wrap">
                          {/* Assignee selector */}
                          <div class="relative assignee-dropdown-container">
                            <button
                              onClick={() => activeAssigneeDropdown.value = activeAssigneeDropdown.value === item.id ? null : item.id}
                              class="btn btn-xs flex items-center gap-2"
                              aria-label={`Assign to: ${item.assignee || 'None'}`}
                              aria-haspopup="listbox"
                              aria-expanded={activeAssigneeDropdown.value === item.id}
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
                              aria-label={`Due date: ${item.due_date ? formatFriendlyDate(item.due_date) : 'None'}`}
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
                        e.currentTarget.style.background = 'var(--color-danger-bg)';
                        e.currentTarget.style.color = 'var(--color-danger)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--surface-cream-hover)';
                        e.currentTarget.style.color = 'var(--soft-brown)';
                      }}
                      title="Delete"
                      aria-label="Delete action item"
                    >
                      <i class="fa fa-times text-xs"></i>
                    </button>
                      </div>
                    </>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Undo Banner */}
        {undoAction.value && (
          <div
            class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg"
            style={{
              background: 'var(--soft-black)',
              color: 'white',
              animation: 'slideInRight 0.3s ease-out'
            }}
          >
            <span style={{ fontSize: 'var(--text-size)' }}>
              Action item deleted
            </span>
            <button
              onClick={undoDelete}
              class="px-3 py-1 rounded font-bold text-xs"
              style={{
                background: 'var(--color-accent)',
                color: 'white',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Undo
            </button>
          </div>
        )}
      </div>

      {/* Add New Item Modal */}
      {showAddModal.value && (
        <div
          class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-item-modal-title"
        >
          <div ref={modalRef} class="dashboard-card max-w-md w-full mx-4" style={{
            padding: 'var(--card-padding)'
          }}>
            <h3 id="add-item-modal-title" style={{
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
