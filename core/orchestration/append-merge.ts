import type { ActionItem } from "../types/index.ts";

interface AppendStatusUpdate {
  id: string;
  status: "completed" | "pending";
  reason: string;
}

export function mergeAppendActionItems(
  existingActionItems: ActionItem[],
  extractedActionItems: ActionItem[],
  statusUpdates: AppendStatusUpdate[],
  now = new Date().toISOString(),
): ActionItem[] {
  const updatesById = new Map(statusUpdates.map((update) => [
    update.id,
    update,
  ]));

  const updatedExisting = existingActionItems.map((item) => {
    const statusUpdate = updatesById.get(item.id);
    if (!statusUpdate) return item;

    return {
      ...item,
      status: statusUpdate.status,
      updated_at: now,
      ai_checked: true,
      checked_reason: statusUpdate.reason,
    };
  });

  const merged = [...updatedExisting];

  for (const newItem of extractedActionItems) {
    const isDuplicate = merged.some(
      (existing) =>
        existing.description.toLowerCase().trim() ===
          newItem.description.toLowerCase().trim(),
    );

    if (!isDuplicate) {
      merged.push(newItem);
    }
  }

  return merged;
}
