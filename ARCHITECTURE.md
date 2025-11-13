# 🏗️ Architecture Overview

## Philosophy: The Nervous System

Conversation Mapper is built on a **"nervous system" architecture** - the core AI logic (`/core/`) is framework-agnostic TypeScript that can work anywhere, while the UI framework (Fresh) is just "the body" that presents it.

**The nervous system is where the electricity happens. The framework is just bones.**

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Fresh UI Layer                       │
│  (Islands, Components, Routes - The Body)               │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Islands     │  │  Components  │  │  Routes      │  │
│  │  (Interactive)│  │  (Shared UI) │  │  (Pages/API) │  │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘  │
│         │                                     │          │
└─────────┼─────────────────────────────────────┼──────────┘
          │                                     │
          ▼                                     ▼
┌─────────────────────────────────────────────────────────┐
│              Framework-Agnostic Core                    │
│           (The Nervous System - Pure TS)                │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────┐    │
│  │ AI Logic │  │Orchestration │  │ Type Definitions│   │
│  │ (Gemini) │  │ (Parallel)   │  │                │    │
│  └────┬─────┘  └──────┬───────┘  └────────────────┘    │
│       │               │                                  │
│       └───────────────┴──────────► Pure TypeScript      │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
                ┌─────────────────────┐
                │  Google Gemini API  │
                │  (AI Processing)    │
                └─────────────────────┘
```

## Directory Structure

### `/core/` - The Nervous System (Framework-Agnostic)

**Pure TypeScript. Zero framework dependencies. Can be used anywhere.**

```
/core/
├── ai/                      # AI service and prompts
│   ├── prompts.ts          # All Gemini prompts as constants
│   └── gemini.ts           # Gemini API wrapper (pure TS)
│
├── types/                   # TypeScript type definitions
│   ├── action-item.ts      # Action items with AI checkoff
│   ├── conversation.ts     # Conversation data structure
│   ├── node.ts             # Topic nodes (emoji + color)
│   ├── edge.ts             # Topic relationships
│   ├── transcript.ts       # Transcript segments
│   └── index.ts            # Exports all types
│
├── orchestration/          # Parallel processing logic
│   ├── conversation-flow.ts    # Main flow: Audio/Text → Data
│   ├── parallel-analysis.ts    # Runs AI operations in parallel
│   └── index.ts
│
├── export/                 # Format transformers
│   ├── formats.ts          # Pre-defined export formats
│   ├── transformer.ts      # Conversation → markdown/blog/etc
│   └── index.ts
│
├── storage/                # Persistence helpers
│   ├── localStorage.ts     # Browser localStorage wrapper
│   └── shareService.ts     # URL-based sharing with compression
│
└── README.md               # Core documentation
```

**Key principle**: If you rebuild the UI in React, Vue, Svelte, or even a CLI app, you can reuse `/core/` entirely.

### `/islands/` - Interactive Components (Fresh-Specific)

**Preact components with client-side interactivity.**

```
/islands/
├── UploadIsland.tsx           # Audio/text upload + recording
├── AudioRecorder.tsx          # Record and append audio
├── AudioVisualizer.tsx        # Real-time audio waveform
├── EmojimapViz.tsx            # Topic graph visualization wrapper
├── ForceDirectedGraph.tsx     # D3.js force layout graph
├── MarkdownMakerDrawer.tsx    # Export drawer (right side)
├── ShareButton.tsx            # Share conversation
├── HomeIsland.tsx             # Main dashboard layout
└── ThemeToggle.tsx            # Dark/light mode toggle
```

**Islands = Fresh's hydration model**: Only these components run JavaScript on the client.

### `/components/` - Shared UI Components

**Pure presentation components (no interactivity).**

```
/components/
├── LoadingIndicator.tsx    # Loading spinner
├── LoadingModal.tsx        # Full-screen loading overlay
├── ContextMenu.tsx         # Right-click menu
└── JuicyThemes.tsx         # Theme provider wrapper
```

### `/routes/` - Pages & API Endpoints

**Fresh convention: file-based routing.**

```
/routes/
├── index.tsx               # Home page (main app)
├── shared/
│   ├── index.tsx          # Share listing page
│   └── [shareId].tsx      # View shared conversation
└── api/
    ├── process.ts         # POST: Process audio/text
    ├── append.ts          # POST: Append audio to conversation
    └── gemini.ts          # POST: Generate markdown exports
```

**API routes** use the `/core/` nervous system to do all the heavy lifting.

### `/signals/` - Global State

**Preact signals for reactive state management.**

```
/signals/
└── conversationStore.ts   # Global conversation data signal
```

**Signals = simple reactive state**: When `conversationData.value` changes, all components re-render.

### `/utils/` - Utility Functions

**Helpers that don't belong in core.**

```
/utils/
├── geminiService.ts          # Browser-side Gemini wrapper
├── forceDirectedEmojimap.ts  # D3.js graph builder
├── markdownPrompts.ts        # Export format prompts
└── toast.ts                  # Toast notifications
```

### `/theme-system/` - Theming

```
/theme-system/
├── asciifier-themes.ts    # Theme definitions
└── mod.ts                 # Theme exports
```

## Data Flow

### 1. User Uploads Audio/Text

```
User Action (UploadIsland.tsx)
      │
      ▼
  POST /api/process
      │
      ▼
  processAudio() or processText()    ← /core/orchestration/conversation-flow.ts
      │
      ▼
  analyzeAudio() or analyzeText()    ← /core/orchestration/parallel-analysis.ts
      │
      ├─► Transcribe audio (Gemini)
      ├─► Extract topics (Gemini)
      ├─► Extract action items (Gemini)
      ├─► Generate summary (Gemini)
      └─► Check action item status (Gemini)  ← AI Self-Checkoff!
      │
      ▼
  Return ConversationFlowResult
      │
      ▼
  conversationData.value = result    ← Global signal
      │
      ▼
  All islands re-render with new data
```

**Key insight**: AI operations run **in parallel** for speed.

### 2. AI Self-Checkoff (The Magic Feature)

```
User appends new audio: "I finished that task"
      │
      ▼
  POST /api/append
      │
      ▼
  processAudio(aiService, blob, id, existingActionItems)
      │
      ▼
  analyzeAudio() runs in parallel:
      ├─► New action items
      └─► checkActionItemStatus(audio, existingActionItems)
              │
              ▼
          Gemini compares audio to existing items
              │
              ▼
          Returns: [{ id: "123", status: "completed", reason: "..." }]
      │
      ▼
  Merge results: Mark matching items as complete
      │
      ▼
  conversationData.value updated
      │
      ▼
  UI shows completed checkboxes ✓
```

**The AI listens to new input and automatically checks off tasks!**

### 3. Export to Different Formats

```
User clicks "Export as Blog Post"
      │
      ▼
  MarkdownMakerDrawer.tsx
      │
      ▼
  POST /api/gemini
      │
      ▼
  aiService.generateMarkdown(formatPrompt, transcript)
      │
      ▼
  Gemini transforms conversation → blog post
      │
      ▼
  Return markdown
      │
      ▼
  Display in drawer with copy button
```

**Same conversation, many formats**: blog, manual, haiku, summary, etc.

### 4. Share Conversation

```
User clicks "Share"
      │
      ▼
  ShareButton.tsx
      │
      ▼
  compressData(conversationData.value)    ← LZ compression
      │
      ▼
  Base64 encode
      │
      ▼
  Create URL: /shared?data=<base64>
      │
      ▼
  Copy to clipboard
```

**No server storage**: Entire conversation encoded in URL.

## Key Design Patterns

### 1. Framework-Agnostic Core

**Problem**: UI frameworks change. AI logic shouldn't.

**Solution**: Extract all AI logic into pure TypeScript with zero framework dependencies.

```typescript
// ✅ Core function - works anywhere
export async function processAudio(
  aiService: AIService,
  audioBlob: Blob,
  conversationId: string,
  existingActionItems: ActionItem[] = []
): Promise<ConversationFlowResult> {
  // Pure TypeScript - no Fresh, React, Vue, etc.
}
```

### 2. Parallel AI Processing

**Problem**: Sequential AI calls are slow.

**Solution**: Run all AI operations in parallel with `Promise.all()`.

```typescript
// Run 4 AI operations simultaneously
const [topics, actionItems, statusUpdates, summary] = await Promise.all([
  aiService.extractTopics(text),
  aiService.extractActionItems(text, speakers),
  aiService.checkActionItemStatus(text, existingActionItems),
  aiService.generateSummary(text)
]);
```

**Result**: 4x faster than sequential calls.

### 3. Signal-Based State

**Problem**: Prop drilling and state management complexity.

**Solution**: Global reactive signals.

```typescript
// One signal, many listeners
export const conversationData = signal<ConversationData | null>(null);

// Auto-saves to localStorage on change
effect(() => {
  if (conversationData.value && !isViewingShared.value) {
    debouncedSave(conversationData.value);
  }
});
```

### 4. Islands Architecture

**Problem**: Too much client-side JavaScript.

**Solution**: Only interactive components hydrate on client.

- **Islands** (`/islands/`): Interactive, run on client
- **Components** (`/components/`): Static, render server-side

**Fresh automatically handles the split.**

## Technology Decisions

### Why Fresh?

- **Islands architecture**: Ship less JavaScript
- **Deno runtime**: Modern, TypeScript-native
- **File-based routing**: Convention over configuration
- **Edge-ready**: Deploy to Deno Deploy

### Why Google Gemini?

- **Multimodal**: Audio transcription built-in
- **Fast**: gemini-2.0-flash-exp is quick
- **Generous free tier**: Good for development
- **JSON mode**: Reliable structured output

### Why D3.js for Graphs?

- **Force-directed layouts**: Organic topic clustering
- **Mature library**: Battle-tested
- **Full control**: Custom node/edge rendering

### Why Preact Signals?

- **Simple**: No reducers, actions, or middleware
- **Fast**: Direct reactivity without virtual DOM diffing
- **Automatic effects**: Auto-save on changes

### Why LocalStorage?

- **Privacy-first**: No server storage
- **Fast**: Instant load times
- **Simple**: No database setup
- **Shareable**: URL-based sharing with compression

## Deployment Architecture

```
┌─────────────────┐
│   User Browser  │
│                 │
│  ┌───────────┐  │
│  │LocalStorage│  │  ← Conversation storage
│  └───────────┘  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Deno Deploy    │  ← Fresh app (static + API routes)
│  (Edge Runtime) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Gemini API     │  ← AI processing
│  (Google Cloud) │
└─────────────────┘
```

**Stateless server**: All conversation data lives in browser. Server just proxies to Gemini.

## Extension Points

### Want to add a new export format?

1. Add prompt to `/utils/markdownPrompts.ts`
2. UI automatically picks it up (no code changes needed)

### Want to use a different AI model?

1. Implement the `AIService` interface in `/core/ai/gemini.ts`
2. Swap in your model (OpenAI, Claude, local LLM, etc.)

### Want to rebuild the UI in React?

1. Keep `/core/` as-is
2. Rebuild `/islands/` and `/components/` in React
3. Replace `/routes/` with your routing setup

**The nervous system stays. Only the body changes.**

## Performance Considerations

### 1. Parallel Processing

All AI operations run simultaneously to minimize latency.

### 2. Debounced Saves

LocalStorage writes are debounced (500ms) to avoid excessive I/O.

### 3. Islands Hydration

Only interactive islands load JavaScript on the client.

### 4. Lazy Graph Rendering

Force-directed graph only renders when visible (overlay toggle).

### 5. Audio Chunking

MediaRecorder chunks audio for streaming uploads.

## Security Considerations

### 1. API Key Protection

- Gemini API key stored in server environment variables
- Never exposed to client
- API routes proxy requests

### 2. File Size Limits

- 50MB max audio file size (prevents abuse)
- Client-side validation before upload

### 3. Input Sanitization

- All user input sent to Gemini (trusted AI model)
- No raw HTML rendering (markdown only)

### 4. No Server-Side Storage

- All data in browser (user controls their data)
- Shared links use compressed data in URL (read-only)

## Testing Strategy

**Note**: No tests currently implemented, but here's the recommended approach:

### Core Logic (Pure Functions)

- Unit test `/core/` functions with mock AI service
- Easy to test (no framework dependencies)

### Islands (Interactive Components)

- Integration tests with Preact testing library
- Mock signal state

### API Routes

- API endpoint tests with mock requests
- Test error handling and validation

### End-to-End

- Playwright tests for full user flows
- Mock Gemini API responses

## Future Architecture Considerations

### 1. Backend Storage Option

Add optional Supabase integration:
- Store conversations in database
- User authentication
- Shareable links without URL compression

### 2. Real-Time Collaboration

- WebSocket integration
- Multiple users viewing same conversation
- Live topic graph updates

### 3. Plugin System

- Allow custom export formats
- Custom AI models
- Custom visualization layouts

### 4. Mobile Apps

- React Native wrapper around `/core/`
- Native audio recording
- Offline-first with sync

---

**The architecture is simple by design**: Pure TypeScript core, reactive signals, parallel AI, and framework-agnostic logic. The nervous system can outlive any UI framework.
