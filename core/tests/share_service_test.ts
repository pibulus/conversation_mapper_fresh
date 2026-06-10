import {
  encodeShareDataForUrl,
  loadUrlSharedConversation,
} from "../storage/shareService.ts";
import type { ConversationData } from "../types/conversation-data.ts";
import { assertEquals, assertExists } from "./_assert.ts";

const sampleConversation: ConversationData = {
  conversation: {
    id: "conv_1",
    title: "Launch Planning",
    source: "text",
    transcript: "Alice: Ship beta.\nBob: Write onboarding.",
    created_at: "2026-06-10T00:00:00.000Z",
  },
  transcript: {
    text: "Alice: Ship beta.\nBob: Write onboarding.",
    speakers: ["Alice", "Bob"],
  },
  nodes: [
    { id: "topic_1", label: "Beta", emoji: "🚀", color: "#ff5c8d" },
    { id: "topic_2", label: "Onboarding", emoji: "📝", color: "#7c3aed" },
  ],
  edges: [
    {
      id: "edge_1",
      source_topic_id: "topic_1",
      target_topic_id: "topic_2",
      color: "#ff5c8d",
    },
  ],
  actionItems: [
    {
      id: "action_1",
      conversation_id: "conv_1",
      description: "Write onboarding",
      assignee: "Bob",
      due_date: "2026-06-12",
      status: "pending",
      created_at: "2026-06-10T00:00:00.000Z",
      updated_at: "2026-06-10T00:00:00.000Z",
    },
  ],
  statusUpdates: [],
  summary: "The team agreed to ship the beta and prepare onboarding.",
};

Deno.test("URL share preserves dashboard output data", () => {
  const encoded = encodeShareDataForUrl(sampleConversation);
  const shared = loadUrlSharedConversation(encoded);

  assertExists(shared);
  assertEquals(shared.conversation.title, "Launch Planning");
  assertEquals(shared.transcript.speakers, ["Alice", "Bob"]);
  assertEquals(shared.nodes.length, 2);
  assertEquals(shared.edges.length, 1);
  assertEquals(shared.actionItems.length, 1);
  assertEquals(
    shared.summary,
    "The team agreed to ship the beta and prepare onboarding.",
  );
});

Deno.test("URL share loader accepts older minimal share payloads", () => {
  const oldPayload = {
    title: "Old Link",
    summary: "Legacy summary",
    transcript: {
      text: "Speaker1: hello",
      speakers: ["Speaker1"],
    },
    actionItems: [],
    timestamp: "2026-06-10T00:00:00.000Z",
  };
  const encoded = btoa(encodeURIComponent(JSON.stringify(oldPayload)));
  const shared = loadUrlSharedConversation(encoded);

  assertExists(shared);
  assertEquals(shared.conversation.title, "Old Link");
  assertEquals(shared.conversation.source, "shared");
  assertEquals(shared.nodes, []);
  assertEquals(shared.edges, []);
  assertEquals(shared.transcript.text, "Speaker1: hello");
});
