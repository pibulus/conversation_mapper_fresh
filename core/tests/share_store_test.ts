import { MemoryShareStore } from "../realtime/shareStore.ts";
import type { ConversationData } from "../../signals/conversationStore.ts";
import { assertEquals, assertExists } from "./_assert.ts";

const sampleConversation: ConversationData = {
  conversation: {
    id: "conv_1",
    title: "Store Test",
    source: "text",
    transcript: "Speaker1: hello",
    created_at: "2026-06-10T00:00:00.000Z",
  },
  transcript: {
    text: "Speaker1: hello",
    speakers: ["Speaker1"],
  },
  nodes: [],
  edges: [],
  actionItems: [],
  statusUpdates: [],
  summary: "Summary",
};

Deno.test("MemoryShareStore creates and reads share records", async () => {
  const store = new MemoryShareStore();
  const created = await store.create(sampleConversation, { ttlMs: 60_000 });
  const loaded = await store.get(created.metadata.shareId);

  assertExists(loaded);
  assertEquals(loaded.metadata.shareId, created.metadata.shareId);
  assertEquals(loaded.data.summary, "Summary");
});

Deno.test("MemoryShareStore expires records", async () => {
  const store = new MemoryShareStore();
  const created = await store.create(sampleConversation, { ttlMs: -1 });
  const loaded = await store.get(created.metadata.shareId);

  assertEquals(loaded, null);
});
