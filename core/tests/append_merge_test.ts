import { assertEquals } from "./_assert.ts";
import { mergeAppendActionItems } from "../orchestration/append-merge.ts";
import type { ActionItem } from "../types/index.ts";

const timestamp = "2026-06-10T00:00:00.000Z";

function item(
  id: string,
  description: string,
  status: "pending" | "completed" = "pending",
): ActionItem {
  return {
    id,
    conversation_id: "conversation-1",
    description,
    assignee: null,
    due_date: null,
    status,
    created_at: "2026-06-09T00:00:00.000Z",
    updated_at: "2026-06-09T00:00:00.000Z",
  };
}

Deno.test("mergeAppendActionItems applies status updates to existing items", () => {
  const merged = mergeAppendActionItems(
    [item("existing-1", "Send the recap")],
    [item("new-1", "Book the venue")],
    [{
      id: "existing-1",
      status: "completed",
      reason: "The new recording says the recap was sent.",
    }],
    timestamp,
  );

  assertEquals(merged.length, 2);
  assertEquals(merged[0].status, "completed");
  assertEquals(merged[0].ai_checked, true);
  assertEquals(
    merged[0].checked_reason,
    "The new recording says the recap was sent.",
  );
  assertEquals(merged[0].updated_at, timestamp);
  assertEquals(merged[1].description, "Book the venue");
});

Deno.test("mergeAppendActionItems can reopen an existing completed item", () => {
  const merged = mergeAppendActionItems(
    [item("existing-1", "Publish the post", "completed")],
    [],
    [{
      id: "existing-1",
      status: "pending",
      reason: "The recording clarified it is not published yet.",
    }],
    timestamp,
  );

  assertEquals(merged.length, 1);
  assertEquals(merged[0].status, "pending");
  assertEquals(merged[0].ai_checked, true);
});

Deno.test("mergeAppendActionItems skips duplicate extracted items", () => {
  const merged = mergeAppendActionItems(
    [item("existing-1", "Send the recap")],
    [
      item("new-1", " send the recap "),
      item("new-2", "Confirm launch date"),
    ],
    [],
    timestamp,
  );

  assertEquals(merged.map((actionItem) => actionItem.description), [
    "Send the recap",
    "Confirm launch date",
  ]);
});
