import {
  createShareRoomMetadata,
  isShareRoomExpired,
  sanitizeShareConversation,
} from "../realtime/shareProtocol.ts";
import { assertEquals, assertExists } from "./_assert.ts";

Deno.test("sanitizeShareConversation keeps core shared outputs", () => {
  const sanitized = sanitizeShareConversation({
    conversation: {
      id: "conv_1",
      title: "  Planning   Session  ",
      source: "text",
      transcript: "Alice: hello",
      created_at: "2026-06-10T00:00:00.000Z",
    },
    transcript: {
      text: "Alice: hello",
      speakers: ["Alice", "Alice", "Bob"],
    },
    nodes: [{ id: "n1", label: "Topic", emoji: "🧠", color: "#ff5c8d" }],
    edges: [{ source_topic_id: "n1", target_topic_id: "n2", color: "#111" }],
    actionItems: [{
      id: "a1",
      conversation_id: "conv_1",
      description: "Follow up",
      assignee: "Bob",
      due_date: null,
      status: "completed",
      created_at: "2026-06-10T00:00:00.000Z",
      updated_at: "2026-06-10T00:00:00.000Z",
    }],
    summary: "Useful summary",
  });

  assertExists(sanitized);
  assertEquals(sanitized.conversation.title, "Planning Session");
  assertEquals(sanitized.transcript.speakers, ["Alice", "Bob"]);
  assertEquals(sanitized.nodes.length, 1);
  assertEquals(sanitized.edges.length, 1);
  assertEquals(sanitized.actionItems[0].status, "completed");
  assertEquals(sanitized.summary, "Useful summary");
});

Deno.test("sanitizeShareConversation rejects empty transcript payloads", () => {
  const sanitized = sanitizeShareConversation({
    conversation: { id: "conv_1", source: "text" },
    transcript: { text: "", speakers: [] },
  });

  assertEquals(sanitized, null);
});

Deno.test("share metadata expiry is deterministic", () => {
  const data = sanitizeShareConversation({
    conversation: {
      id: "conv_1",
      source: "text",
      transcript: "Speaker1: hello",
    },
    transcript: { text: "Speaker1: hello", speakers: ["Speaker1"] },
  });
  assertExists(data);

  const now = new Date("2026-06-10T00:00:00.000Z");
  const metadata = createShareRoomMetadata("cm_test", data, 1000, now);

  assertEquals(metadata.expiresAt, "2026-06-10T00:00:01.000Z");
  assertEquals(isShareRoomExpired(metadata, now.getTime()), false);
  assertEquals(isShareRoomExpired(metadata, now.getTime() + 1001), true);
});
