# Conversation Mapper - Development Guide

## What This App Is

A Deno Fresh (Preact + Tailwind) web app that turns meeting recordings into structured knowledge using Google Gemini AI. Users record/upload audio or paste text, and get: transcripts with speaker diarization, auto-extracted action items, topic relationship graphs (D3 force-directed), summaries, and export to various formats.

**Killer feature**: AI Self-Checkoff - user says "I finished that report" in a follow-up recording and the AI auto-completes the matching action item.

Runs on `localhost:8003` via `deno task dev`. Requires `GEMINI_API_KEY` in `.env`.

## Architecture Map

```
/core/                  # Framework-agnostic AI brain (MOST VALUABLE CODE)
  ai/gemini.ts          # AIService interface + Gemini wrapper
  ai/prompts.ts         # All AI prompt templates
  orchestration/        # Parallel processing (text + audio flows)
    conversation-flow.ts  # Main orchestrator, returns ConversationFlowResult
    parallel-analysis.ts  # Promise.all for topics/actions/status/summary
  types/index.ts        # All TypeScript type definitions
  storage/              # localStorage + shareService
  export/               # Format transformers

/islands/               # 16 interactive Preact islands
  HomeIsland.tsx        # Main layout - shows Upload or Dashboard
  UploadIsland.tsx      # Text paste + audio upload + recording trigger
  DashboardIsland.tsx   # Dashboard cards container
  AudioRecorder.tsx     # In-conversation audio recording (append flow)
  MarkdownMakerDrawer.tsx # Export drawer (calls /api/gemini)
  EmojimapViz.tsx       # Topic graph overlay (wraps ForceDirectedGraph)
  ConversationList.tsx  # Sidebar conversation history
  ForceDirectedGraph.tsx, ArcDiagramViz.tsx, CircularNetworkGraph.tsx  # D3 vizzes

/components/            # Shared UI cards
  ActionItemsCard.tsx   # Action items with drag, sort, inline edit, AI checkoff
  SummaryCard.tsx, TranscriptCard.tsx, TopicVisualizationsCard.tsx

/signals/
  conversationStore.ts  # THE global state - single Preact signal (ConversationData)

/routes/
  index.tsx             # Renders HomeIsland
  api/process.ts        # POST: new conversation (audio or text) -> full analysis
  api/append.ts         # POST: append audio to existing conversation
  api/gemini.ts         # POST: markdown generation for export feature
  shared/[shareId].tsx  # Shareable conversation links (data compressed in URL)
```

## Data Flow (Critical Path)

1. User submits text/audio via `UploadIsland` -> `POST /api/process`
2. Server creates Gemini model, calls `processText()` or `processAudio()` from `/core/orchestration/conversation-flow.ts`
3. Orchestrator runs parallel AI analysis (topics + action items + status checks + summary) via `parallel-analysis.ts`
4. Result (`ConversationFlowResult`) returned to client
5. Client sets `conversationData.value = result` (the global signal)
6. All dashboard components reactively render from that signal
7. Auto-save to localStorage via effect in `conversationStore.ts`

**Append flow**: `AudioRecorder` -> `POST /api/append` -> same pipeline but merges with existing data

## Key Patterns

- **State**: Single `conversationData` signal in `signals/conversationStore.ts`. All components read from it. Mutations update `.value` directly.
- **API key security**: Gemini API key is server-side only. Client code in `utils/geminiService.ts` calls `/api/gemini` route. Never import `@google/generative-ai` in islands.
- **AI Service**: `core/ai/gemini.ts` exports `createGeminiService(model)` returning an `AIService` interface. All AI calls go through this interface. Prompts live in `core/ai/prompts.ts`.
- **Islands architecture**: Fresh hydrates only `islands/` components. Non-interactive stuff goes in `components/`. Don't put state or effects in `components/`.

## Known Issues (Priority Order)

### HIGH - Functional

1. **Inline style chaos**: 406+ hardcoded `px`/`rem` values across components bypass the CSS design token system defined in `static/styles.css`. The tokens exist (`--card-padding`, `--border-radius`, `--tiny-size`, etc.) but aren't used. This makes theming and responsive behavior inconsistent.
   - **Fix approach**: Systematically replace hardcoded values with CSS custom properties. Start with the most-used components (HomeIsland, ActionItemsCard, DashboardIsland).

2. **No tests**: Zero test coverage. The `/core/` directory is pure TypeScript with no framework dependencies - ideal for unit testing. Start here.
   - **Fix approach**: Add tests for `core/ai/gemini.ts` (mock model, test JSON parsing), `core/orchestration/` (test parallel flows), `core/storage/localStorage.ts`.

### MEDIUM - Code Quality

3. **Stale documentation**: 8 audit markdown files in root (`ACTION_ITEMS_AUDIT.md`, `CONSISTENCY_AUDIT.md`, etc.) reference code/components that no longer exist (e.g., `theme-system/` directory, `JuicyThemes.tsx`). These are from November 2025 audits and are now misleading.
   - **Fix approach**: Either delete them or consolidate into a single `AUDIT_HISTORY.md` for reference.

4. **README model name**: Says `gemini-2.0-flash-exp` but code uses `gemini-2.5-flash`. Update README.

5. **16 islands may be too many**: Some could be consolidated. `EmojimapViz` is essentially a thin wrapper around `ForceDirectedGraph`. `VisualizationSelector` might fold into `TopicVisualizationsCard`.

### LOW - Nice to Have

6. **`api/joke.ts`**: Leftover route - unclear purpose. Candidate for removal.

7. **Share feature uses URL compression**: Data is encoded in the URL itself (no server storage). This works but has URL length limits. Fine for now but worth noting.

## Gotchas and Landmines

- **Don't add ThemeShuffler back** without creating the actual component. It was removed because the theme system was nuked and rebuilt multiple times. The current "unified design system" in the last commit is the settled approach.
- **`conversationData.value` can be null**. Always null-check before accessing nested properties. The signal starts null and gets set after processing or localStorage restore.
- **Audio processing sends raw audio blob to Gemini** for action item extraction (not the transcribed text). This is intentional - Gemini can process audio directly and may catch nuances the transcript misses.
- **The `@core/` import alias** is defined in `deno.json` as `"@core/": "./core/"`. If imports from core break, check this mapping.
- **Fresh regenerates `fresh.gen.ts`** automatically during dev. Don't manually edit it. If a new island/route isn't registering, restart the dev server.
- **localStorage auto-save**: Any mutation to `conversationData.value` triggers a debounced save. The `isViewingShared` flag prevents saving when viewing someone else's shared conversation.

## Style Guidelines for This Codebase

- Commit messages use conventional commits with emoji: `fix: ...`, `feat: ...`, `refactor: ...`
- Components use inline styles extensively (this is the tech debt, not a pattern to follow)
- CSS custom properties are defined in `static/styles.css` `:root` - prefer these over hardcoded values
- Preact signals for state, not useState/useReducer
- Keep `/core/` framework-agnostic - no Preact imports, no DOM APIs, pure TypeScript only

## When Adding Features

1. AI logic goes in `/core/ai/` or `/core/orchestration/`
2. Interactive UI goes in `/islands/`
3. Static/presentational UI goes in `/components/`
4. New API endpoints go in `/routes/api/`
5. Types go in `/core/types/index.ts`
6. Update `signals/conversationStore.ts` ConversationData interface if adding new data fields
