# Glossary - Conversation Mapper

## Islands (Interactive Components)
- `HomeIsland` - Main upload/processing interface (islands/HomeIsland.tsx)
- `DashboardIsland` - Draggable masonry dashboard with 4 cards (islands/DashboardIsland.tsx)
- `UploadIsland` - File upload + text paste handler (islands/UploadIsland.tsx)
- `ConversationList` - History of processed conversations (islands/ConversationList.tsx)
- `EmojimapViz` - Non-chronological topic graph overlay (islands/EmojimapViz.tsx)
- `CircularNetworkGraph` - Circular topic visualization (islands/CircularNetworkGraph.tsx)
- `ForceDirectedGraph` - Force-directed topic graph (islands/ForceDirectedGraph.tsx)
- `ArcDiagramViz` - Arc diagram visualization (islands/ArcDiagramViz.tsx)
- `VisualizationSelector` - Switch between viz types (islands/VisualizationSelector.tsx)
- `MarkdownMakerDrawer` - Export to multiple formats (islands/MarkdownMakerDrawer.tsx)
- `ShareButton` - Generate shareable links (islands/ShareButton.tsx)
- `SharedConversationLoader` - Load shared conversations (islands/SharedConversationLoader.tsx)
- `MobileHistoryMenu` - Mobile conversation history (islands/MobileHistoryMenu.tsx)

## Components (Shared UI)
- `LoadingIndicator` - Loading state component (components/LoadingIndicator.tsx)

## API Routes
- `POST /api/process` - Parallel AI processing (transcribe + extract + summarize + graph) (routes/api/process.ts)
- `GET /api/joke` - Random conversation joke (routes/api/joke.ts)

## Core Modules (`/core/`)
- `ai/prompts.ts` - All Gemini AI prompts
- `ai/gemini.ts` - Gemini API wrapper
- `orchestration/` - Parallel processing coordination
- `export/` - Transform to blog/manual/haiku formats
- `types/` - TypeScript definitions

## Key Concepts
- **AI Self-Checkoff** - AI auto-completes action items by listening to new input
- **Masonry Dashboard** - Muuri-powered draggable 4-card layout (transcript/summary/actions/audio)
- **EmojimapViz** - Topic graph showing relationships (not chronological)
- **Parallel AI Processing** - Transcribe, extract, summarize, graph happen simultaneously
- **Export Formats** - Blog post, manual, haiku, etc.
- **Storage** - IndexedDB (local) + Supabase (cloud)
