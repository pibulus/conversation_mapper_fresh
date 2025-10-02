import UploadIsland from "../islands/UploadIsland.tsx";
import DashboardIsland from "../islands/DashboardIsland.tsx";
import EmojimapViz from "../islands/EmojimapViz.tsx";

export default function Home() {
  return (
    <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header class="border-b-4 border-purple-400 bg-white shadow-lg">
        <div class="max-w-6xl mx-auto px-6 py-4">
          <h1 class="text-3xl font-bold text-purple-600">
            🧠 Conversation Mapper
          </h1>
          <p class="text-sm text-gray-600 mt-1">
            Meeting transcripts that make sense
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main class="max-w-6xl mx-auto px-6 py-8">
        <div class="grid gap-6">
          {/* Upload Section */}
          <section class="bg-white rounded-lg border-4 border-pink-300 shadow-lg p-6">
            <h2 class="text-xl font-bold text-pink-600 mb-4">
              📤 Upload Conversation
            </h2>
            <UploadIsland />
          </section>

          {/* Dashboard with draggable cards */}
          <section>
            <DashboardIsland />
          </section>

          {/* Topic Map Visualization */}
          <section>
            <EmojimapViz />
          </section>
        </div>
      </main>
    </div>
  );
}
