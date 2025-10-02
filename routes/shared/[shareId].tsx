/**
 * Shared Conversation Route - Public View
 *
 * Read-only view of shared conversations accessible via share link
 */

import { PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import SharedConversationLoader from "../../islands/SharedConversationLoader.tsx";

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
