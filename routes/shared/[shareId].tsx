/**
 * Shared Conversation Route - Public View
 *
 * Read-only view of shared conversations accessible via share link
 */

import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import DashboardIsland from "../../islands/DashboardIsland.tsx";

export default function SharedConversation({ params }: PageProps) {
  const { shareId } = params;

  return (
    <>
      <Head>
        <title>Shared Conversation | Conversation Mapper</title>
        <meta name="description" content="View shared conversation analysis" />
      </Head>

      <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        {/* Header */}
        <header class="border-b-4 border-purple-400 bg-white shadow-lg">
          <div class="max-w-6xl mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold text-purple-600">
                  🧠 Conversation Mapper
                </h1>
                <p class="text-sm text-gray-600 mt-1">
                  Shared conversation view
                </p>
              </div>
              <a
                href="/"
                class="bg-purple-500 text-white font-bold py-2 px-4 rounded-lg border-2 border-purple-700 hover:bg-purple-600 transition-colors"
              >
                ✨ Create Your Own
              </a>
            </div>
          </div>
        </header>

        {/* Main Content - Initialize conversation from share ID */}
        <main class="max-w-6xl mx-auto px-6 py-8">
          <SharedConversationLoader shareId={shareId} />
        </main>
      </div>
    </>
  );
}

/**
 * Client-side loader island to fetch shared conversation
 */
import { useEffect } from "preact/hooks";
import { loadSharedConversation } from "../../core/storage/shareService.ts";
import { conversationData } from "../../signals/conversationStore.ts";

function SharedConversationLoader({ shareId }: { shareId: string }) {
  useEffect(() => {
    // Load the shared conversation on mount
    const shared = loadSharedConversation(shareId);

    if (shared) {
      // Set conversation data (without the share metadata)
      conversationData.value = {
        conversation: shared.conversation,
        transcript: shared.transcript,
        nodes: shared.nodes,
        edges: shared.edges,
        actionItems: shared.actionItems,
        statusUpdates: shared.statusUpdates,
        summary: shared.summary,
      };
    }
  }, [shareId]);

  // Check if conversation loaded
  const hasConversation = conversationData.value !== null;

  if (!hasConversation) {
    return (
      <div class="bg-white rounded-lg border-4 border-red-300 shadow-lg p-8 text-center">
        <div class="text-6xl mb-4">😔</div>
        <h2 class="text-2xl font-bold text-red-600 mb-2">
          Conversation Not Found
        </h2>
        <p class="text-gray-700 mb-6">
          This share link may have expired or doesn't exist.
        </p>
        <a
          href="/"
          class="inline-block bg-purple-500 text-white font-bold py-2 px-6 rounded-lg border-2 border-purple-700 hover:bg-purple-600 transition-colors"
        >
          Go to Home
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Info Banner */}
      <div class="bg-blue-100 border-4 border-blue-300 rounded-lg p-4 mb-6">
        <p class="text-sm text-blue-800">
          📢 This is a read-only view of a shared conversation.{" "}
          <a href="/" class="underline font-bold hover:text-blue-600">
            Create your own
          </a>{" "}
          to analyze your meetings!
        </p>
      </div>

      {/* Dashboard with read-only data */}
      <DashboardIsland />
    </div>
  );
}
